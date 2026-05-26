import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import {
  createOrderShipmentWorkflow,
  markOrderFulfillmentAsDeliveredWorkflow,
} from "@medusajs/medusa/core-flows"
import type {
  ShipmozoFulfillmentData,
  ShipmozoWebhookPayload,
} from "../../../modules/shipmozo/types"

const PROVIDER_MARKER = "shipmozo"
const DELIVERED_STATUSES = new Set(["delivered", "rto delivered"])

type OrderFulfillmentRow = {
  id?: string
  provider_id?: string | null
  data?: Record<string, unknown> | null
  shipped_at?: string | null
  delivered_at?: string | null
  canceled_at?: string | null
}

type OrderRow = {
  id?: string
  display_id?: number | string
  status?: string | null
  items?: Array<{ id?: string; quantity?: number }>
  fulfillments?: OrderFulfillmentRow[]
}

/**
 * Shipmozo posts here whenever a shipment changes state — pickup completed,
 * in transit, out for delivery, delivered, undelivered, cancelled, RTO. We
 *
 *   1. persist the latest tracking snapshot onto the fulfillment, and
 *   2. on first AWB, register a Medusa shipment so order.fulfillment_status
 *      flips to "shipped" and the tracking number lands on the order, and
 *   3. on a terminal "delivered" status, mark the fulfillment delivered.
 *
 * Configure the URL in Shipmozo's panel under Settings → Webhook. Set
 * SHIPMOZO_WEBHOOK_SECRET in env, then append it as `?secret=...` to the
 * configured URL — we reject mismatched requests.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // Optional shared-secret check. Shipmozo doesn't sign payloads, so this is
  // the only thing standing between the endpoint and the open internet.
  const expectedSecret = process.env.SHIPMOZO_WEBHOOK_SECRET
  if (expectedSecret) {
    const provided =
      (req.headers["x-shipmozo-secret"] as string | undefined) ??
      ((req.query?.secret as string | undefined) || undefined)
    if (provided !== expectedSecret) {
      res.status(401).json({ error: "invalid secret" })
      return
    }
  }

  const payload = (req.body ?? {}) as ShipmozoWebhookPayload
  const shipmozoOrderId = (payload.order_id ?? "").trim()
  if (!shipmozoOrderId) {
    res.status(400).json({ error: "order_id is required" })
    return
  }

  // We push orders to Shipmozo with a `mc_<display_id>` order_id so the
  // webhook payload's order_id round-trips back to a Medusa order. Fall back
  // to scanning the order's fulfillments if the prefix doesn't match (e.g.
  // when Shipmozo issued its own id).
  const displayIdMatch = shipmozoOrderId.match(/^mc_(\d+)/i)
  const displayId = displayIdMatch ? displayIdMatch[1] : undefined

  let order: OrderRow | undefined
  if (displayId) {
    try {
      const { data } = await query.graph({
        entity: "order",
        filters: { display_id: displayId },
        fields: [
          "id",
          "display_id",
          "status",
          "items.id",
          "items.quantity",
          "fulfillments.id",
          "fulfillments.provider_id",
          "fulfillments.data",
          "fulfillments.shipped_at",
          "fulfillments.delivered_at",
          "fulfillments.canceled_at",
        ],
        pagination: { take: 1 },
      })
      order = data?.[0] as OrderRow | undefined
    } catch (e) {
      logger.warn(
        `shipmozo-webhook: order lookup failed for display_id=${displayId} — ${
          (e as Error).message
        }`
      )
    }
  }

  if (!order) {
    logger.warn(
      `shipmozo-webhook: could not match a Medusa order for shipmozo_order_id=${shipmozoOrderId}.`
    )
    res.status(202).json({ ignored: true, reason: "order-not-found" })
    return
  }

  const referenceId = payload.reference_id ?? payload.refrence_id

  const matchFulfillment = (f: OrderFulfillmentRow): boolean => {
    const provId = (f.provider_id ?? "").toLowerCase()
    if (!provId.includes(PROVIDER_MARKER)) return false
    const sm = (f.data as { shipmozo?: ShipmozoFulfillmentData } | null | undefined)
      ?.shipmozo
    if (!sm) return false
    return (
      sm.order_id === shipmozoOrderId ||
      sm.reference_id === shipmozoOrderId ||
      (!!referenceId &&
        (sm.order_id === referenceId || sm.reference_id === referenceId))
    )
  }

  const fulfillment = (order.fulfillments ?? []).find(matchFulfillment)
  if (!fulfillment?.id) {
    logger.warn(
      `shipmozo-webhook: order ${order.id} has no Shipmozo fulfillment matching shipmozo_order_id=${shipmozoOrderId}.`
    )
    res.status(202).json({ ignored: true, reason: "fulfillment-not-found" })
    return
  }

  const currentStatus = (payload.current_status ?? "").trim()
  const lowerStatus = currentStatus.toLowerCase()

  // 1. Persist the latest tracking snapshot.
  const existing =
    ((fulfillment.data as { shipmozo?: ShipmozoFulfillmentData } | null | undefined)
      ?.shipmozo as ShipmozoFulfillmentData | undefined) ?? ({
      order_id: shipmozoOrderId,
    } as ShipmozoFulfillmentData)

  const trackingUrl = (() => {
    const tpl = process.env.SHIPMOZO_TRACKING_URL_TEMPLATE
    const awb = payload.awb_number ?? existing.awb_number
    if (tpl && awb) return tpl.replace(/\{awb\}/g, awb)
    return existing.tracking_url
  })()

  const merged: ShipmozoFulfillmentData = {
    ...existing,
    order_id: existing.order_id ?? shipmozoOrderId,
    reference_id: referenceId ?? existing.reference_id,
    awb_number: payload.awb_number ?? existing.awb_number,
    courier: payload.carrier ?? existing.courier,
    delivery_partner_name:
      payload.delivery_name ??
      payload.delhivery_name ??
      existing.delivery_partner_name,
    delivery_partner_phone:
      payload.delivery_phone ??
      payload.delhivery_phone ??
      existing.delivery_partner_phone,
    expected_delivery_date:
      payload.expected_delivery_date ?? existing.expected_delivery_date,
    shipment_type: payload.shipment_type ?? existing.shipment_type,
    current_status: currentStatus || existing.current_status,
    status_time: payload.status_time ?? existing.status_time,
    scan_history: payload.status_feed?.scan ?? existing.scan_history,
    tracking_url: trackingUrl,
  }

  try {
    const fulfillmentModule = req.scope.resolve(Modules.FULFILLMENT)
    await fulfillmentModule.updateFulfillment(fulfillment.id, {
      data: {
        ...((fulfillment.data as Record<string, unknown> | null | undefined) ?? {}),
        shipmozo: merged,
      },
    })
  } catch (e) {
    logger.error(
      `shipmozo-webhook: failed to persist tracking data on fulfillment ${fulfillment.id} — ${
        (e as Error).message
      }`
    )
    res.status(500).json({ error: "failed to persist" })
    return
  }

  // 2. On first AWB, register a Medusa shipment so the order is marked
  //    shipped and the tracking number is surfaced to admin/storefront.
  const awb = payload.awb_number ?? existing.awb_number
  if (awb && !fulfillment.shipped_at && !fulfillment.canceled_at) {
    try {
      const itemsToShip = (order.items ?? [])
        .filter((it): it is { id: string; quantity: number } => {
          return typeof it.id === "string" && (it.quantity ?? 0) > 0
        })
        .map((it) => ({ id: it.id, quantity: it.quantity }))

      await createOrderShipmentWorkflow(req.scope).run({
        input: {
          order_id: order.id as string,
          fulfillment_id: fulfillment.id,
          items: itemsToShip,
          labels: [
            {
              tracking_number: awb,
              tracking_url: trackingUrl ?? "",
              label_url: "",
            },
          ],
          no_notification: false,
        },
      })
      logger.info(
        `shipmozo-webhook: registered shipment for order ${order.id} (awb=${awb}).`
      )
    } catch (e) {
      logger.error(
        `shipmozo-webhook: failed to register shipment for order ${order.id} — ${
          (e as Error).message
        }`
      )
    }
  }

  // 3. On "delivered" (or RTO-delivered), close out the fulfillment.
  if (
    DELIVERED_STATUSES.has(lowerStatus) &&
    !fulfillment.delivered_at &&
    !fulfillment.canceled_at
  ) {
    try {
      await markOrderFulfillmentAsDeliveredWorkflow(req.scope).run({
        input: {
          orderId: order.id as string,
          fulfillmentId: fulfillment.id,
        },
      })
      logger.info(
        `shipmozo-webhook: marked fulfillment ${fulfillment.id} as delivered.`
      )
    } catch (e) {
      logger.error(
        `shipmozo-webhook: failed to mark delivered for fulfillment ${fulfillment.id} — ${
          (e as Error).message
        }`
      )
    }
  }

  res.status(200).json({ received: true })
}

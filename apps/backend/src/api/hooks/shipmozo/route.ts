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
  email?: string | null
  status?: string | null
  items?: Array<{ id?: string; quantity?: number }>
  fulfillments?: OrderFulfillmentRow[]
}

/**
 * Shipmozo posts here whenever a shipment changes state — pickup completed,
 * in transit, out for delivery, delivered, undelivered, cancelled, RTO.
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
  const expectedSecret = process.env.SHIPMOZO_WEBHOOK_SECRET?.trim()
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

  // The merchant-supplied id we sent on /push-order round-trips back as
  // `reference_id` (or the typo'd `refrence_id`). We sent `mc_<display_id>`,
  // so parse the Medusa order's display_id out of that.
  const referenceId = (
    payload.reference_id ??
    payload.refrence_id ??
    ""
  ).trim()
  if (!referenceId) {
    res.status(400).json({ error: "reference_id is required" })
    return
  }

  const displayIdMatch = referenceId.match(/^mc_(\d+)/i)
  if (!displayIdMatch) {
    logger.warn(
      `shipmozo-webhook: reference_id=${referenceId} does not match mc_<display_id> — ignoring.`
    )
    res.status(202).json({ ignored: true, reason: "non-medusa-reference" })
    return
  }
  const displayId = displayIdMatch[1]

  let order: OrderRow | undefined
  try {
    const { data } = await query.graph({
      entity: "order",
      filters: { display_id: displayId },
      fields: [
        "id",
        "display_id",
        "email",
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

  if (!order) {
    logger.warn(
      `shipmozo-webhook: could not match a Medusa order for reference_id=${referenceId}.`
    )
    res.status(202).json({ ignored: true, reason: "order-not-found" })
    return
  }

  const shipmozoOrderId = (payload.order_id ?? "").trim()

  const matchFulfillment = (f: OrderFulfillmentRow): boolean => {
    const provId = (f.provider_id ?? "").toLowerCase()
    if (!provId.includes(PROVIDER_MARKER)) return false
    const sm = (f.data as { shipmozo?: ShipmozoFulfillmentData } | null | undefined)
      ?.shipmozo
    if (!sm) return false
    return (
      sm.reference_id === referenceId ||
      sm.order_id === referenceId ||
      (!!shipmozoOrderId &&
        (sm.order_id === shipmozoOrderId || sm.reference_id === shipmozoOrderId))
    )
  }

  // If only one shipmozo fulfillment exists on the order, fall back to it
  // when the stored reference_id wasn't populated (e.g. orders pushed
  // before reference_id was tracked).
  const shipmozoFulfillments = (order.fulfillments ?? []).filter((f) =>
    (f.provider_id ?? "").toLowerCase().includes(PROVIDER_MARKER)
  )
  const fulfillment =
    shipmozoFulfillments.find(matchFulfillment) ??
    (shipmozoFulfillments.length === 1 ? shipmozoFulfillments[0] : undefined)

  if (!fulfillment?.id) {
    logger.warn(
      `shipmozo-webhook: order ${order.id} has no Shipmozo fulfillment matching reference_id=${referenceId}.`
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
      order_id: shipmozoOrderId || referenceId,
    } as ShipmozoFulfillmentData)

  // Shipmozo's webhook doesn't carry a tracking URL, so build a customer-facing
  // tracking link from a configurable base + AWB when both are available.
  const awbForUrl = payload.awb_number ?? existing.awb_number
  const trackingBase = process.env.SHIPMOZO_TRACKING_URL_BASE?.trim()
  const trackingUrl =
    existing.tracking_url ??
    (trackingBase && awbForUrl
      ? `${trackingBase}${encodeURIComponent(awbForUrl)}`
      : undefined)

  const merged: ShipmozoFulfillmentData = {
    ...existing,
    order_id: existing.order_id ?? shipmozoOrderId ?? referenceId,
    reference_id: existing.reference_id ?? referenceId,
    awb_number: payload.awb_number ?? existing.awb_number,
    courier: payload.carrier ?? existing.courier,
    tracking_url: trackingUrl,
    current_status: currentStatus || existing.current_status,
    status_time: payload.status_time ?? existing.status_time,
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
              tracking_url: merged.tracking_url ?? "",
              label_url: "",
            },
          ],
          no_notification: false,
        },
      })
      logger.info(
        `shipmozo-webhook: registered shipment for order ${order.id} (awb=${awb}).`
      )

      // Notify the customer their order has shipped — once, on first AWB. The
      // `!fulfillment.shipped_at` guard above ensures this block runs a single
      // time; a mail failure must not break the webhook or shipment.
      if (order.email) {
        try {
          const notificationService = req.scope.resolve(Modules.NOTIFICATION)
          await notificationService.createNotifications({
            to: order.email,
            channel: "email",
            template: "order-shipped",
            data: {
              display_id: order.display_id,
              awb,
              courier: merged.courier ?? "",
              tracking_url: merged.tracking_url ?? "",
              subject: `Your order #${order.display_id} has shipped`,
            },
          })
          logger.info(
            `shipmozo-webhook: sent shipped email for order ${order.id}.`
          )
        } catch (e) {
          logger.error(
            `shipmozo-webhook: failed to send shipped email for order ${order.id} — ${
              (e as Error).message
            }`
          )
        }
      }
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

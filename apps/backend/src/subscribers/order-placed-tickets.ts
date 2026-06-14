import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  createOrderFulfillmentWorkflow,
  createOrderShipmentWorkflow,
} from "@medusajs/medusa/core-flows"
import { randomBytes } from "crypto"

// Issues event tickets for digital line items when an order is placed:
//   1. Detect line items whose product is on the "Digital Delivery" shipping
//      profile (the same axis used to keep them off Shipmozo).
//   2. Generate one unique code per unit (qty 2 → 2 codes).
//   3. Create a manual-provider fulfillment for those items and mark it shipped
//      (no physical movement), persisting the codes on the fulfillment.
//   4. Email the codes to the customer via the notification module.
//
// Idempotent (skips if a manual/digital fulfillment already exists) and fully
// wrapped — a failure here never rolls back the order.
const DIGITAL_PROFILE_NAME = "Digital Delivery"

type OrderItem = {
  id: string
  product_id?: string | null
  title?: string | null
  quantity?: number | string | null
}

type Ticket = {
  line_item_id: string
  product_id?: string | null
  title: string
  unit: number
  code: string
}

function ticketCode(displayId: unknown): string {
  const rand = randomBytes(5).toString("hex").toUpperCase() // 10 hex chars
  return `MC-EVT-${displayId ?? "0"}-${rand}`
}

function qty(raw: OrderItem["quantity"]): number {
  const n = Number(raw ?? 0)
  return Number.isFinite(n) && n > 0 ? n : 0
}

export default async function orderPlacedTickets({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const orderModule = container.resolve(Modules.ORDER) as {
    retrieveOrder: (
      id: string,
      config?: { relations?: string[] }
    ) => Promise<{ fulfillments?: Array<{ id?: string; provider_id?: string | null; shipped_at?: unknown }> }>
  }
  const orderId = event.data?.id
  if (!orderId) return

  try {
    // 1. Resolve the Digital Delivery profile.
    const { data: profiles } = await query.graph({
      entity: "shipping_profile",
      fields: ["id", "name"],
    })
    const digital = profiles.find((p) => p.name === DIGITAL_PROFILE_NAME)
    if (!digital) {
      logger.warn(
        `order-placed-tickets: "${DIGITAL_PROFILE_NAME}" profile missing — run setup-digital-delivery.ts. Skipping.`
      )
      return
    }

    // 2. Load order items + shipping methods. Quantities can read as 0 right
    //    after order.placed, so retry briefly.
    const loadOrder = async () => {
      const { data } = await query.graph({
        entity: "order",
        fields: [
          "id",
          "display_id",
          "email",
          "items.id",
          "items.product_id",
          "items.title",
          "items.quantity",
          "shipping_methods.shipping_option_id",
        ],
        filters: { id: orderId },
        pagination: { take: 1 },
      })
      return data?.[0] as unknown as
        | {
            id: string
            display_id?: string | number
            email?: string | null
            items?: OrderItem[]
            shipping_methods?: Array<{ shipping_option_id?: string | null }>
          }
        | undefined
    }
    let order = await loadOrder()
    for (
      let i = 0;
      i < 4 &&
      order &&
      (order.items ?? []).every((it) => qty(it.quantity) === 0);
      i++
    ) {
      await new Promise((r) => setTimeout(r, 500 * (i + 1)))
      order = await loadOrder()
    }
    if (!order) return

    // Idempotency: if a manual (digital) fulfillment already exists, tickets
    // were issued on a previous delivery of this event.
    let existingFulfillments: Array<{
      id?: string
      provider_id?: string | null
      shipped_at?: unknown
    }> = []
    try {
      const full = await orderModule.retrieveOrder(orderId, {
        relations: ["fulfillments"],
      })
      existingFulfillments = full?.fulfillments ?? []
    } catch {
      /* no fulfillments yet */
    }
    if (
      existingFulfillments.some((f) =>
        String(f?.provider_id ?? "").includes("manual")
      )
    ) {
      logger.info(
        `order-placed-tickets: order ${orderId} already has a digital fulfillment; skipping.`
      )
      return
    }

    // 3. Which line items are tickets? (product on the Digital profile)
    const productIds = Array.from(
      new Set(
        (order.items ?? [])
          .map((it) => it.product_id)
          .filter((id): id is string => !!id)
      )
    )
    if (!productIds.length) return
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "shipping_profile.id"],
      filters: { id: productIds },
    })
    const digitalProductIds = new Set(
      (products as Array<{ id: string; shipping_profile?: { id?: string } | null }>)
        .filter((p) => p.shipping_profile?.id === digital.id)
        .map((p) => p.id)
    )
    const ticketItems = (order.items ?? [])
      .filter((it) => it.product_id && digitalProductIds.has(it.product_id))
      .map((it) => ({ ...it, qty: qty(it.quantity) }))
      .filter((it) => it.qty > 0)
    if (!ticketItems.length) {
      logger.info(
        `order-placed-tickets: order ${orderId} has no ticket items; skipping.`
      )
      return
    }

    // 4. One unique code per unit.
    const tickets: Ticket[] = ticketItems.flatMap((it) =>
      Array.from({ length: it.qty }, (_, i) => ({
        line_item_id: it.id,
        product_id: it.product_id,
        title: it.title ?? "Event ticket",
        unit: i + 1,
        code: ticketCode(order!.display_id),
      }))
    )

    // 5. Find the digital shipping option on this order (for the fulfillment).
    const optionIds = (order.shipping_methods ?? [])
      .map((m) => m?.shipping_option_id)
      .filter((id): id is string => !!id)
    let digitalOption:
      | {
          id?: string
          shipping_profile_id?: string
          service_zone?: {
            fulfillment_set?: { location?: { id?: string | null } | null } | null
          } | null
        }
      | undefined
    if (optionIds.length) {
      const { data: opts } = await query.graph({
        entity: "shipping_option",
        fields: [
          "id",
          "shipping_profile_id",
          "provider_id",
          "service_zone.fulfillment_set.location.id",
        ],
        filters: { id: optionIds },
      })
      digitalOption = (opts as typeof digitalOption[]).find(
        (o) => o?.shipping_profile_id === digital.id
      )
    }

    // 6. Create + ship the manual fulfillment for the ticket items.
    if (digitalOption?.id) {
      try {
        const { result } = await createOrderFulfillmentWorkflow(container).run({
          input: {
            order_id: orderId,
            items: ticketItems.map((it) => ({ id: it.id, quantity: it.qty })),
            shipping_option_id: digitalOption.id,
            location_id:
              digitalOption.service_zone?.fulfillment_set?.location?.id ??
              undefined,
            no_notification: true,
            metadata: { type: "digital_tickets", tickets },
          },
        })

        // Resolve the new fulfillment id (workflow result, else re-read order).
        let fulfillmentId = (result as { id?: string } | undefined)?.id
        if (!fulfillmentId) {
          const full = await orderModule.retrieveOrder(orderId, {
            relations: ["fulfillments"],
          })
          fulfillmentId = (full?.fulfillments ?? [])
            .filter(
              (f) =>
                String(f?.provider_id ?? "").includes("manual") && !f?.shipped_at
            )
            .map((f) => f.id)
            .filter((id): id is string => !!id)
            .pop()
        }

        if (fulfillmentId) {
          await createOrderShipmentWorkflow(container).run({
            input: {
              order_id: orderId,
              fulfillment_id: fulfillmentId,
              items: ticketItems.map((it) => ({ id: it.id, quantity: it.qty })),
            },
          })
        }
        logger.info(
          `order-placed-tickets: issued + shipped ${tickets.length} ticket(s) for order ${orderId}.`
        )
      } catch (e) {
        logger.error(
          `order-placed-tickets: fulfillment failed for order ${orderId} — ${
            (e as Error).message
          }. Emailing tickets anyway.`
        )
      }
    } else {
      logger.warn(
        `order-placed-tickets: order ${orderId} has no digital shipping method; emailing tickets without a fulfillment.`
      )
    }

    // 7. Email the tickets.
    if (order.email) {
      const notificationService = container.resolve(Modules.NOTIFICATION)
      await notificationService.createNotifications({
        to: order.email,
        channel: "email",
        template: "event-tickets",
        data: {
          display_id: order.display_id,
          tickets,
          subject: `Your event ticket${
            tickets.length > 1 ? "s" : ""
          } — order #${order.display_id}`,
        },
      })
      logger.info(
        `order-placed-tickets: emailed ${tickets.length} ticket(s) to ${order.email}.`
      )
    } else {
      logger.warn(
        `order-placed-tickets: order ${orderId} has no email; tickets generated but not sent.`
      )
    }
  } catch (e) {
    logger.error(
      `order-placed-tickets: failed for order ${orderId} — ${
        (e as Error).message
      }`
    )
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}

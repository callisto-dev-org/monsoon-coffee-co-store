import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  createOrderFulfillmentWorkflow,
  createOrderShipmentWorkflow,
  markOrderFulfillmentAsDeliveredWorkflow,
} from "@medusajs/medusa/core-flows"
import { randomBytes } from "crypto"

import { renderTicketPdf, type TicketPdfTicket } from "../modules/smtp-notification/ticket-pdf"
import { EVENT_TICKET_MODULE } from "../modules/event-ticket"
import { ticketVerifyUrl } from "../modules/event-ticket/normalize"

// Handles the digital side of an order the moment it's placed:
//   1. Detect line items whose product is on the "Digital Delivery" shipping
//      profile (the same axis used to keep them off Shipmozo).
//   2. AUTO-FULFILL every digital item — create one manual-provider fulfillment,
//      mark it shipped, then delivered (there's no physical movement, so digital
//      goods are delivered the instant the order lands).
//   3. For the subset that are EVENT products (they have an event_detail sheet),
//      mint one unique admit-one code per unit and email a custom PDF ticket
//      carrying the event details + codes.
//
// Idempotent (skips if a manual/digital fulfillment already exists) and fully
// wrapped — a failure here never rolls back the order.
const DIGITAL_PROFILE_NAME = "Digital Delivery"

type OrderItem = {
  id: string
  product_id?: string | null
  title?: string | null
  // On this store `items.quantity` from the graph can come back undefined unless
  // `items.detail.quantity` is co-selected (a known computed-field quirk — see
  // the order-totals memory). We select both and read whichever is populated.
  quantity?: number | string | null
  detail?: { quantity?: number | string | null } | null
}

type EventDetail = {
  product_id?: string | null
  partner?: string | null
  venue?: string | null
  city?: string | null
  date_label?: string | null
  start_time?: string | null
  end_time?: string | null
  seats_total?: number | null
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

// Reliable per-item quantity: prefer the line-item detail (always hydrated when
// co-selected), fall back to the top-level quantity.
function itemQty(it: OrderItem): number {
  return qty(it.detail?.quantity ?? it.quantity)
}

export default async function orderPlacedTickets({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const orderId = event.data?.id
  if (!orderId) return

  // Read an order's fulfillments via Query (cross-module link aware). The Order
  // module service's `retrieveOrder` does NOT expose `fulfillments` as a
  // relation — asking for it throws "Entity 'Order' does not have property
  // 'fulfillments'", so we go through the graph instead.
  const readFulfillments = async (): Promise<
    Array<{ id?: string; provider_id?: string | null; shipped_at?: unknown }>
  > => {
    try {
      const { data } = await query.graph({
        entity: "order",
        fields: [
          "fulfillments.id",
          "fulfillments.provider_id",
          "fulfillments.shipped_at",
        ],
        filters: { id: orderId },
        pagination: { take: 1 },
      })
      return ((data?.[0] as { fulfillments?: unknown[] } | undefined)
        ?.fulfillments ?? []) as Array<{
        id?: string
        provider_id?: string | null
        shipped_at?: unknown
      }>
    } catch {
      return []
    }
  }

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
          "items.detail.quantity",
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
      (order.items ?? []).every((it) => itemQty(it) === 0);
      i++
    ) {
      await new Promise((r) => setTimeout(r, 500 * (i + 1)))
      order = await loadOrder()
    }
    if (!order) return

    // Idempotency: if a manual (digital) fulfillment already exists, this event
    // was already processed on a previous delivery.
    const existingFulfillments = await readFulfillments()
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

    // 3. Which line items are digital? (product on the Digital profile)
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
    const digitalItems = (order.items ?? [])
      .filter((it) => it.product_id && digitalProductIds.has(it.product_id))
      .map((it) => ({ ...it, qty: itemQty(it) }))
      .filter((it) => it.qty > 0)
    if (!digitalItems.length) {
      logger.info(
        `order-placed-tickets: order ${orderId} has no digital items; skipping.`
      )
      return
    }

    // 3b. Which digital products are EVENTS? (they carry an event_detail sheet)
    const eventByProduct = new Map<string, EventDetail>()
    try {
      const { data: eventDetails } = await query.graph({
        entity: "event_detail",
        fields: [
          "product_id",
          "partner",
          "venue",
          "city",
          "date_label",
          "start_time",
          "end_time",
          "seats_total",
        ],
        filters: { product_id: Array.from(digitalProductIds) },
      })
      for (const ev of eventDetails as EventDetail[]) {
        if (ev.product_id) eventByProduct.set(ev.product_id, ev)
      }
    } catch {
      /* no event details — treat all digital items as plain digital goods */
    }
    const eventItems = digitalItems.filter(
      (it) => it.product_id && eventByProduct.has(it.product_id)
    )

    // 4. One unique admit-one code per unit — events only. Persisted to the
    //    event_ticket module (the source of truth the door scanner verifies
    //    against). Resolving that module is kept lazy + wrapped so plain digital
    //    fulfillment never depends on it being registered.
    let tickets: Ticket[] = eventItems.flatMap((it) =>
      Array.from({ length: it.qty }, (_, i) => ({
        line_item_id: it.id,
        product_id: it.product_id,
        title: it.title ?? "Event ticket",
        unit: i + 1,
        code: ticketCode(order!.display_id),
      }))
    )

    if (tickets.length) {
      try {
        const ticketService = container.resolve(EVENT_TICKET_MODULE) as {
          listEventTickets: (
            filters?: Record<string, unknown>,
            config?: Record<string, unknown>
          ) => Promise<Array<Record<string, unknown>>>
          createEventTickets: (
            data: Array<Record<string, unknown>>
          ) => Promise<unknown>
        }
        const existing = await ticketService.listEventTickets({
          order_id: orderId,
        })
        if (existing.length) {
          // Already minted on a prior run — reuse so codes/QRs stay stable.
          tickets = existing.map((t, i) => ({
            line_item_id: String(t.line_item_id ?? ""),
            product_id: (t.product_id as string | null) ?? null,
            title: String(t.event_title ?? "Event ticket"),
            unit: i + 1,
            code: String(t.code ?? ticketCode(order!.display_id)),
          }))
        } else {
          await ticketService.createEventTickets(
            tickets.map((t) => ({
              code: t.code,
              order_id: orderId,
              order_display_id:
                order!.display_id != null ? String(order!.display_id) : null,
              line_item_id: t.line_item_id,
              product_id: t.product_id ?? null,
              event_title: t.title,
              email: order!.email ?? null,
              status: "valid",
            }))
          )
        }
      } catch (persistErr) {
        logger.error(
          `order-placed-tickets: could not persist tickets for order ${orderId} — ${
            (persistErr as Error).message
          }. They will still be fulfilled/emailed but won't be verifiable.`
        )
      }
    }

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

    // 6. Auto-fulfill every digital item: create the manual fulfillment, ship it,
    //    then mark it delivered (digital goods arrive instantly).
    if (digitalOption?.id) {
      try {
        const { result } = await createOrderFulfillmentWorkflow(container).run({
          input: {
            order_id: orderId,
            items: digitalItems.map((it) => ({ id: it.id, quantity: it.qty })),
            shipping_option_id: digitalOption.id,
            location_id:
              digitalOption.service_zone?.fulfillment_set?.location?.id ??
              undefined,
            no_notification: true,
            metadata: { type: "digital", tickets },
          },
        })

        // Resolve the new fulfillment id (workflow result, else re-read order).
        let fulfillmentId = (result as { id?: string } | undefined)?.id
        if (!fulfillmentId) {
          fulfillmentId = (await readFulfillments())
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
              items: digitalItems.map((it) => ({ id: it.id, quantity: it.qty })),
            },
          })
          // Mark delivered — instant for digital. Non-fatal if it doesn't take.
          try {
            await markOrderFulfillmentAsDeliveredWorkflow(container).run({
              input: { orderId, fulfillmentId, no_notification: true },
            })
          } catch (delErr) {
            logger.warn(
              `order-placed-tickets: could not mark digital fulfillment delivered for order ${orderId} — ${
                (delErr as Error).message
              }`
            )
          }
        }
        logger.info(
          `order-placed-tickets: auto-fulfilled ${digitalItems.length} digital item(s)` +
            `${tickets.length ? ` and issued ${tickets.length} ticket(s)` : ""} for order ${orderId}.`
        )
      } catch (e) {
        logger.error(
          `order-placed-tickets: digital fulfillment failed for order ${orderId} — ${
            (e as Error).message
          }${tickets.length ? ". Emailing tickets anyway." : ""}`
        )
      }
    } else {
      logger.warn(
        `order-placed-tickets: order ${orderId} has no digital shipping method; ` +
          `${tickets.length ? "emailing tickets without a fulfillment." : "nothing to fulfill."}`
      )
    }

    // 7. Email the event tickets (events only) with a custom PDF attached.
    if (!tickets.length) return
    if (order.email) {
      // Decorate tickets with their event details + per-title count (for the PDF).
      const countByLine = new Map<string, number>()
      for (const t of tickets) {
        countByLine.set(t.line_item_id, (countByLine.get(t.line_item_id) ?? 0) + 1)
      }
      const pdfTickets: TicketPdfTicket[] = tickets.map((t) => ({
        title: t.title,
        code: t.code,
        unit: t.unit,
        count: countByLine.get(t.line_item_id) ?? 1,
        verifyUrl: ticketVerifyUrl(t.code),
        event: t.product_id ? eventByProduct.get(t.product_id) ?? null : null,
      }))

      let attachments:
        | Array<{
            filename: string
            content: string
            content_type: string
            disposition: string
          }>
        | undefined
      try {
        const pdf = await renderTicketPdf({
          display_id: order.display_id,
          email: order.email,
          tickets: pdfTickets,
        })
        attachments = [
          {
            filename: `monsoon-tickets-${order.display_id ?? order.id}.pdf`,
            content: pdf.toString("base64"),
            content_type: "application/pdf",
            disposition: "attachment",
          },
        ]
      } catch (pdfErr) {
        logger.warn(
          `order-placed-tickets: ticket PDF failed for order ${orderId} — ${
            (pdfErr as Error).message
          }`
        )
      }

      const notificationService = container.resolve(Modules.NOTIFICATION)
      await notificationService.createNotifications({
        to: order.email,
        channel: "email",
        template: "event-tickets",
        attachments,
        data: {
          display_id: order.display_id,
          tickets,
          has_pdf: !!attachments,
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

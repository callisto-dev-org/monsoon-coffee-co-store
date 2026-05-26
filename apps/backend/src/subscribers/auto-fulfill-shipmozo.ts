import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createOrderFulfillmentWorkflow } from "@medusajs/medusa/core-flows"

type QuantityLike =
  | number
  | string
  | { value?: string; numeric?: number }
  | null
  | undefined

type OrderItem = {
  id?: string
  // Depending on Medusa version, query.graph surfaces the quantity via a
  // mix of these — we coerce whichever comes through.
  quantity?: QuantityLike
  raw_quantity?: QuantityLike
  detail?: {
    quantity?: QuantityLike
    raw_quantity?: QuantityLike
  } | null
}

function toQuantity(raw: QuantityLike): number {
  if (raw === null || raw === undefined) return 0
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0
  if (typeof raw === "string") {
    const n = Number(raw)
    return Number.isFinite(n) ? n : 0
  }
  if (typeof raw === "object") {
    if (typeof raw.numeric === "number" && Number.isFinite(raw.numeric)) {
      return raw.numeric
    }
    if (typeof raw.value === "string") {
      const n = Number(raw.value)
      return Number.isFinite(n) ? n : 0
    }
  }
  return 0
}

function pickQuantity(it: OrderItem): number {
  const candidates: QuantityLike[] = [
    it.quantity,
    it.detail?.quantity,
    it.raw_quantity,
    it.detail?.raw_quantity,
  ]
  for (const c of candidates) {
    const n = toQuantity(c)
    if (n > 0) return n
  }
  return 0
}

type OrderShippingMethod = {
  id?: string
  shipping_option_id?: string | null
}

type OrderRow = {
  id?: string
  fulfillment_status?: string | null
  items?: OrderItem[]
  shipping_methods?: OrderShippingMethod[]
  payment_collections?: Array<{
    payment_sessions?: Array<{
      status?: string | null
      provider_id?: string | null
    }>
  }>
}

type ShippingOptionRow = {
  id?: string
  provider_id?: string | null
  shipping_profile_id?: string | null
  data?: Record<string, unknown> | null
  service_zone?: {
    fulfillment_set?: {
      location?: { id?: string | null } | null
    } | null
  } | null
}

const SHIPMOZO_PROVIDER_MARKER = "shipmozo"

/**
 * Auto-creates a Shipmozo fulfillment as soon as an order is placed.
 *
 * Skips silently when:
 *  - the order has already started fulfillment (idempotent on event retry)
 *  - the order has no Shipmozo shipping method (different provider, manual handling)
 *  - the order has no fulfillable items
 *
 * On failure the subscriber logs and returns — the order itself is not
 * rolled back. Admin can still create the fulfillment manually.
 */
export default async function autoFulfillShipmozo({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const orderId = event.data?.id
  if (!orderId) {
    logger.info("auto-fulfill-shipmozo: order.placed event missing data.id, skipping.")
    return
  }
  logger.info(`auto-fulfill-shipmozo: handling order ${orderId}.`)

  // Step 1 — pull only fields that live inside the order module.
  // Crossing into the fulfillment module via deep traversal (e.g.
  // `shipping_methods.shipping_option.*` or `fulfillments.*`) triggers a
  // `targetMeta` error when the module link isn't configured for that path.
  // Payment collections are sibling-module-linked from order and reliably
  // traversable.
  let order: OrderRow | undefined
  try {
    const { data } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "fulfillment_status",
        "items.id",
        "items.quantity",
        "items.raw_quantity",
        "items.detail.quantity",
        "items.detail.raw_quantity",
        "shipping_methods.id",
        "shipping_methods.shipping_option_id",
        "payment_collections.payment_sessions.status",
        "payment_collections.payment_sessions.provider_id",
      ],
      filters: { id: orderId },
      pagination: { take: 1 },
    })
    order = data?.[0] as OrderRow | undefined
  } catch (e) {
    logger.warn(
      `auto-fulfill-shipmozo: failed to load order ${orderId} — ${(e as Error).message}`
    )
    return
  }

  if (!order) return

  const fulfillmentStatus = (order.fulfillment_status ?? "").toLowerCase()
  if (fulfillmentStatus && fulfillmentStatus !== "not_fulfilled") {
    logger.info(
      `auto-fulfill-shipmozo: order ${orderId} fulfillment_status="${fulfillmentStatus}", skipping.`
    )
    return
  }

  const shippingOptionIds = (order.shipping_methods ?? [])
    .map((m) => m?.shipping_option_id)
    .filter((id): id is string => !!id)

  if (shippingOptionIds.length === 0) {
    logger.info(
      `auto-fulfill-shipmozo: order ${orderId} has no shipping methods, skipping.`
    )
    return
  }

  // Step 2 — resolve provider + location from shipping_option(s).
  let shippingOptions: ShippingOptionRow[] = []
  try {
    const { data } = await query.graph({
      entity: "shipping_option",
      fields: [
        "id",
        "provider_id",
        "shipping_profile_id",
        "data",
        "service_zone.fulfillment_set.location.id",
      ],
      filters: { id: shippingOptionIds },
    })
    shippingOptions = (data ?? []) as ShippingOptionRow[]
  } catch (e) {
    logger.warn(
      `auto-fulfill-shipmozo: failed to load shipping options for order ${orderId} — ${
        (e as Error).message
      }`
    )
    return
  }

  const isShipmozoOption = (o: ShippingOptionRow): boolean => {
    const pid = (o?.provider_id ?? "").toLowerCase()
    if (pid.includes(SHIPMOZO_PROVIDER_MARKER)) return true
    // Fall back to the fulfillment option data: when admin picked
    // `shipmozo-forward` / `shipmozo-return` from getFulfillmentOptions(),
    // it's stored on the option's `data.id` field.
    const dataId = String(
      (o?.data as { id?: unknown } | null | undefined)?.id ?? ""
    ).toLowerCase()
    return dataId.startsWith(`${SHIPMOZO_PROVIDER_MARKER}-`)
  }

  const shipmozoOption = shippingOptions.find(isShipmozoOption)
  if (!shipmozoOption) {
    const dump = shippingOptions
      .map(
        (o) =>
          `id=${o.id} provider_id=${o.provider_id ?? "<null>"} data.id=${
            (o.data as { id?: string } | null | undefined)?.id ?? "<null>"
          }`
      )
      .join(" | ")
    logger.info(
      `auto-fulfill-shipmozo: order ${orderId} has no Shipmozo shipping method, skipping. Options found: ${
        dump || "<none>"
      }`
    )
    return
  }

  const items = (order.items ?? [])
    .filter((it): it is Required<Pick<OrderItem, "id">> & OrderItem => !!it?.id)
    .map((it) => ({
      id: it.id as string,
      quantity: pickQuantity(it),
    }))
    .filter((it) => it.quantity > 0)

  if (items.length === 0) {
    const dump = (order.items ?? [])
      .map(
        (it) =>
          `id=${it?.id ?? "<null>"} ` +
          `quantity=${JSON.stringify(it?.quantity)} ` +
          `raw_quantity=${JSON.stringify(it?.raw_quantity)} ` +
          `detail.quantity=${JSON.stringify(it?.detail?.quantity)} ` +
          `detail.raw_quantity=${JSON.stringify(it?.detail?.raw_quantity)}`
      )
      .join(" | ")
    logger.warn(
      `auto-fulfill-shipmozo: order ${orderId} has no fulfillable items, skipping. Raw items: ${
        dump || "<empty>"
      }`
    )
    return
  }

  // Resolve PREPAID vs COD from the order's active payment session.
  // Provider can't query the cart itself (no DB access in its container),
  // so we pass payment_type through the fulfillment's metadata.
  const codProviderIds = (process.env.SHIPMOZO_COD_PAYMENT_PROVIDER_IDS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  const isCod = (providerId: string | null | undefined): boolean => {
    if (!providerId) return false
    if (codProviderIds.length) {
      return codProviderIds.includes(providerId.toLowerCase())
    }
    return /cod|cash[-_ ]?on[-_ ]?delivery/i.test(providerId)
  }

  const sessions = (order.payment_collections ?? []).flatMap(
    (pc) => pc?.payment_sessions ?? []
  )
  const priority = ["authorized", "captured", "pending"]
  let activeSession = sessions[0]
  for (const status of priority) {
    const found = sessions.find(
      (s) => (s?.status ?? "").toLowerCase() === status
    )
    if (found) {
      activeSession = found
      break
    }
  }
  const paymentType = isCod(activeSession?.provider_id) ? "COD" : "PREPAID"

  try {
    await createOrderFulfillmentWorkflow(container).run({
      input: {
        order_id: orderId,
        items,
        shipping_option_id: shipmozoOption.id ?? undefined,
        location_id:
          shipmozoOption.service_zone?.fulfillment_set?.location?.id ??
          undefined,
        no_notification: false,
        metadata: { payment_type: paymentType },
      },
    })
    logger.info(
      `auto-fulfill-shipmozo: created fulfillment for order ${orderId} (payment_type=${paymentType}).`
    )
  } catch (e) {
    logger.error(
      `auto-fulfill-shipmozo: failed to create fulfillment for order ${orderId} — ${
        (e as Error).message
      }. Admin will need to retry from the order page.`
    )
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}

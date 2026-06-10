import type { ReceiptData } from "./receipt-pdf"

// Single source of truth for turning an order into the receipt payload used by
// BOTH the order-confirmation email (PDF attachment + HTML body) and the
// on-demand order-page PDF route — so all three stay byte-for-byte in sync.
//
// IMPORTANT: read via the Order MODULE service, never the computed `order.total`
// / `items.total`. On this store the on-the-fly total computation is broken (a
// versionless shipping-method adjustment), so those come back 0. The persisted
// truth lives on `order.summary.current_order_total` + line-item `unit_price`.

type BigNumberish =
  | number
  | string
  | { value?: unknown; numeric?: unknown }
  | null
  | undefined

export const toNum = (v: BigNumberish): number => {
  if (v == null) return 0
  if (typeof v === "number") return Number.isFinite(v) ? v : 0
  if (typeof v === "string") {
    const n = parseFloat(v)
    return Number.isFinite(n) ? n : 0
  }
  if (typeof v === "object") {
    if (v.numeric != null) return toNum(v.numeric as BigNumberish)
    if (v.value != null) return toNum(v.value as BigNumberish)
  }
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export type ReceiptOrder = {
  id: string
  display_id?: number | string
  email?: string | null
  currency_code?: string
  created_at?: string | Date
  items?: Array<{
    title?: string
    quantity?: BigNumberish
    unit_price?: BigNumberish
  }>
  summary?: {
    current_order_total?: BigNumberish
    raw_current_order_total?: BigNumberish
    original_order_total?: BigNumberish
  } | null
  shipping_address?: Record<string, unknown> | null
}

// Relations needed to build a receipt from `orderModule.retrieveOrder`.
export const RECEIPT_RELATIONS = ["items", "summary", "shipping_address"]

// True once line items carry real quantity + price (used to ride out the
// `order.placed` timing race where the first read can be all zeros).
export const receiptItemsReady = (o?: ReceiptOrder): boolean =>
  !!o?.items?.length &&
  o.items.every((i) => toNum(i.quantity) > 0 && toNum(i.unit_price) > 0)

export function mapOrderToReceiptData(order: ReceiptOrder): ReceiptData {
  const items = (order.items ?? []).map((i) => {
    const quantity = toNum(i.quantity)
    const unit_price = toNum(i.unit_price)
    return { title: i.title, quantity, unit_price, total: unit_price * quantity }
  })
  // Authoritative paid total from the order summary (handles any
  // tax/discount/adjustments); fall back to summing line items.
  const summaryTotal = toNum(
    order.summary?.current_order_total ??
      order.summary?.raw_current_order_total ??
      order.summary?.original_order_total
  )
  const total =
    summaryTotal > 0 ? summaryTotal : items.reduce((s, i) => s + i.total, 0)
  const placed = order.created_at
    ? new Date(order.created_at).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : undefined
  return {
    display_id: order.display_id,
    email: order.email ?? undefined,
    placed,
    items,
    total,
    shipping_address: order.shipping_address,
  }
}

type OrderModuleLike = {
  retrieveOrder: (
    id: string,
    config?: { relations?: string[] }
  ) => Promise<ReceiptOrder>
}

// Retrieve + map in one call (used by the PDF route, where the order is already
// fully committed so no polling is needed).
export async function buildOrderReceipt(
  orderModule: OrderModuleLike,
  orderId: string
): Promise<ReceiptData | null> {
  const order = await orderModule
    .retrieveOrder(orderId, { relations: RECEIPT_RELATIONS })
    .catch(() => null)
  if (!order) return null
  return mapOrderToReceiptData(order)
}

"use server"

import { adminSdk } from "@/lib/medusa"

export type SalesPoint = { date: string } & Record<string, number | string>

export type SalesResponse = {
  ok: boolean
  data?: SalesPoint[]
  error?: string
  orderCount?: number
}

export async function getSales(
  productIds: string[],
  fromIso: string,
  toIso: string,
  metric: "revenue" | "units"
): Promise<SalesResponse> {
  if (!productIds.length) return { ok: true, data: [], orderCount: 0 }

  try {
    const sdk = await adminSdk()

    // Pull orders in window. For an MVP we cap at 500 — covers small stores
    // well; replace with paginated fetch if your volume is higher.
    const orders: any[] = []
    let offset = 0
    const limit = 100
    while (offset < 500) {
      const res: any = await sdk.admin.order.list({
        limit,
        offset,
        created_at: { $gte: fromIso, $lte: toIso },
        fields: "id,created_at,currency_code,*items,items.product_id,items.unit_price,items.quantity",
      } as any)
      const batch = res?.orders || []
      orders.push(...batch)
      if (batch.length < limit) break
      offset += limit
    }

    const wanted = new Set(productIds)

    // bucket: dateISO (yyyy-mm-dd) -> productId -> number
    const buckets = new Map<string, Map<string, number>>()
    const allDates = new Set<string>()
    const fromDay = fromIso.slice(0, 10)
    const toDay = toIso.slice(0, 10)
    // pre-seed every day in the range so the chart shows zero days
    for (
      let d = new Date(fromDay);
      d <= new Date(toDay);
      d.setUTCDate(d.getUTCDate() + 1)
    ) {
      allDates.add(d.toISOString().slice(0, 10))
    }

    for (const order of orders) {
      const day = (order.created_at || "").slice(0, 10)
      if (!day) continue
      allDates.add(day)
      for (const item of order.items || []) {
        const pid = item.product_id
        if (!pid || !wanted.has(pid)) continue
        const qty = Number(item.quantity || 0)
        const unit = Number(item.unit_price || 0)
        const value = metric === "units" ? qty : (qty * unit) / 100 // amounts are in minor units
        if (!buckets.has(day)) buckets.set(day, new Map())
        const m = buckets.get(day)!
        m.set(pid, (m.get(pid) || 0) + value)
      }
    }

    const sortedDays = [...allDates].sort()
    const data: SalesPoint[] = sortedDays.map((day) => {
      const point: SalesPoint = { date: day }
      const m = buckets.get(day)
      for (const pid of productIds) {
        point[pid] = Number((m?.get(pid) || 0).toFixed(2))
      }
      return point
    })

    return { ok: true, data, orderCount: orders.length }
  } catch (e: any) {
    return { ok: false, error: e?.message || "Failed to fetch sales." }
  }
}

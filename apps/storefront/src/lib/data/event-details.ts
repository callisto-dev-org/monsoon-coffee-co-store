"use server"

import { sdk } from "@lib/config"

export type EventDetail = {
  id: string
  product_id: string
  partner?: string | null
  venue?: string | null
  city?: string | null
  date_label?: string | null
  event_date?: string | null
  start_time?: string | null
  end_time?: string | null
  seats_total?: number | null
  description?: string | null
  highlights?: string[] | null
  images?: string[] | null
}

export async function getProductEventDetail(
  productId: string
): Promise<EventDetail | null> {
  try {
    const res = await sdk.client.fetch<{ event_detail: EventDetail | null }>(
      `/store/products/${productId}/event-detail`,
      {
        method: "GET",
        next: { tags: [`product-${productId}`, "products"] },
      }
    )
    return res?.event_detail ?? null
  } catch {
    return null
  }
}

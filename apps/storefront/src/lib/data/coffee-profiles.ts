"use server"

import { sdk } from "@lib/config"

export type ExtractionPoint = {
  time_s: number
  yield_g: number
  tds?: number | null
}

export type CoffeeProfile = {
  id: string
  product_id: string
  origin?: string | null
  altitude_m?: number | null
  varietal?: string | null
  process?: string | null
  roast_level?: string | null
  roast_date?: string | null
  harvest_year?: number | null
  recommended_ratio?: string | null
  tasting_notes?: string[] | null
  extraction_profile?: ExtractionPoint[] | null
}

export async function getProductCoffeeProfile(
  productId: string
): Promise<CoffeeProfile | null> {
  try {
    const res = await sdk.client.fetch<{
      coffee_profile: CoffeeProfile | null
    }>(`/store/products/${productId}/coffee-profile`, {
      method: "GET",
      next: { tags: [`product-${productId}`, "products"] },
    })
    return res?.coffee_profile ?? null
  } catch {
    return null
  }
}

"use server"

import { sdk } from "@lib/config"

export type BrewParamSchemaItem = {
  key: string
  label: string
  unit?: string
}

export type BrewStep = {
  name: string
  description: string
}

export type BrewMethod = {
  id: string
  slug: string
  name: string
  method_label?: string | null
  summary?: string | null
  image_url?: string | null
  param_schema?: BrewParamSchemaItem[] | null
  steps?: BrewStep[] | null
  position?: number
}

export type BrewRecipe = {
  id: string
  product_id: string
  title?: string | null
  summary?: string | null
  params?: Record<string, string> | null
  steps?: BrewStep[] | null
  brew_method: BrewMethod
}

export async function listProductBrews(productId: string): Promise<BrewRecipe[]> {
  try {
    const res = await sdk.client.fetch<{ brew_recipes: BrewRecipe[] }>(
      `/store/products/${productId}/brews`,
      { method: "GET", cache: "no-store" }
    )
    return res?.brew_recipes || []
  } catch {
    return []
  }
}

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

const FALLBACK_CATEGORY_HANDLE = "coffee"

/**
 * Whether the brew lab section should render for a product. Pulls the list
 * of enabled product category IDs from /store/brew-settings; falls back to
 * a category with handle "coffee" when no setting has been saved yet.
 */
export async function isBrewLabEnabledForProduct(product: {
  categories?: Array<{ id?: string | null; handle?: string | null }> | null
}): Promise<boolean> {
  const categories = (product.categories ?? []).filter(
    (c): c is { id?: string | null; handle?: string | null } => !!c
  )

  let enabledIds: string[] = []
  try {
    const res = await sdk.client.fetch<{
      enabled_product_category_ids: string[]
    }>("/store/brew-settings", { method: "GET", cache: "no-store" })
    enabledIds = res?.enabled_product_category_ids ?? []
  } catch {
    enabledIds = []
  }

  if (enabledIds.length > 0) {
    const enabled = new Set(enabledIds)
    return categories.some((c) => !!c.id && enabled.has(c.id))
  }
  return categories.some(
    (c) =>
      typeof c.handle === "string" &&
      c.handle.toLowerCase() === FALLBACK_CATEGORY_HANDLE
  )
}

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

const FALLBACK_PRODUCT_TYPE_VALUE = "coffee"

/**
 * Whether the brew lab section should render for a product. Pulls the list
 * of enabled product type IDs from /store/brew-settings; falls back to a
 * product type with value "coffee" when no setting has been saved yet.
 */
export async function isBrewLabEnabledForProduct(product: {
  type_id?: string | null
  type?: { id?: string | null; value?: string | null } | null
}): Promise<boolean> {
  const typeId = product.type_id ?? product.type?.id ?? null
  const typeValue = product.type?.value ?? null

  let enabledIds: string[] = []
  try {
    const res = await sdk.client.fetch<{ enabled_product_type_ids: string[] }>(
      "/store/brew-settings",
      { method: "GET", cache: "no-store" }
    )
    enabledIds = res?.enabled_product_type_ids ?? []
  } catch {
    enabledIds = []
  }

  if (enabledIds.length > 0) {
    return !!typeId && enabledIds.includes(typeId)
  }
  return (
    typeof typeValue === "string" &&
    typeValue.toLowerCase() === FALLBACK_PRODUCT_TYPE_VALUE
  )
}

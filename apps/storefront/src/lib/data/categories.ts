import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { withCache } from "@lib/redis/with-cache"
import { getCacheOptions } from "./cookies"

const CATEGORIES_TTL = 60 * 15

export const listCategories = async (query?: Record<string, unknown>) => {
  const limit = (query?.limit as number | undefined) || 100
  const cacheKey = ["categories", "list", String(limit), JSON.stringify(query ?? {})]

  return withCache(
    cacheKey,
    async () => {
      const next = { ...(await getCacheOptions("categories")) }
      return sdk.client
        .fetch<{ product_categories: HttpTypes.StoreProductCategory[] }>(
          "/store/product-categories",
          {
            query: {
              fields:
                "*category_children, *products, *parent_category, *parent_category.parent_category",
              limit,
              ...query,
            },
            next,
            cache: "force-cache",
          }
        )
        .then(({ product_categories }) => product_categories)
    },
    { ttlSeconds: CATEGORIES_TTL }
  )
}

export const getCategoryByHandle = async (categoryHandle: string[]) => {
  const handle = `${categoryHandle.join("/")}`

  return withCache(
    ["categories", "handle", handle],
    async () => {
      const next = { ...(await getCacheOptions("categories")) }
      return sdk.client
        .fetch<HttpTypes.StoreProductCategoryListResponse>(
          `/store/product-categories`,
          {
            query: { fields: "*category_children, *products", handle },
            next,
            cache: "force-cache",
          }
        )
        .then(({ product_categories }) => product_categories[0])
    },
    { ttlSeconds: CATEGORIES_TTL }
  )
}

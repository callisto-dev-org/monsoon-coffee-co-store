import type { MetadataRoute } from "next"

import { listProducts } from "@lib/data/products"
import { listCollections } from "@lib/data/collections"
import { listCategories } from "@lib/data/categories"
import { listRegions } from "@lib/data/regions"
import { absoluteUrl } from "@lib/util/seo"

// Static, publicly crawlable routes (relative to the country segment). Excludes
// account / cart / checkout / auth / order which are transactional or private.
const STATIC_PATHS = [
  "",
  "/store",
  "/about",
  "/contact",
  "/privacy-policy",
  "/refund-policy",
  "/shipping-policy",
  "/terms-of-service",
  "/terms-of-use",
]

const DEFAULT_COUNTRY = "in"

async function getDefaultCountryCode(): Promise<string> {
  try {
    const regions = await listRegions()
    const code = regions?.[0]?.countries?.[0]?.iso_2
    return code ?? DEFAULT_COUNTRY
  } catch {
    return DEFAULT_COUNTRY
  }
}

async function getProductEntries(countryCode: string) {
  const entries: { handle: string; updatedAt?: string }[] = []
  try {
    let page = 1
    // Cap pagination so a misbehaving backend can't spin forever.
    for (let i = 0; i < 50; i++) {
      const { response, nextPage } = await listProducts({
        countryCode,
        pageParam: page,
        queryParams: { limit: 100, fields: "handle,updated_at" },
      })
      for (const product of response.products) {
        if (product.handle) {
          entries.push({
            handle: product.handle,
            updatedAt: product.updated_at ?? undefined,
          })
        }
      }
      if (!nextPage) break
      page = nextPage
    }
  } catch {
    // Backend unavailable — fall back to whatever we collected.
  }
  return entries
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const countryCode = await getDefaultCountryCode()
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: absoluteUrl(`/${countryCode}${path}`),
    lastModified: now,
    changeFrequency: path === "" || path === "/store" ? "daily" : "monthly",
    priority: path === "" ? 1 : path === "/store" ? 0.9 : 0.4,
  }))

  const [products, collectionsResult, categories] = await Promise.all([
    getProductEntries(countryCode),
    listCollections({ fields: "handle" }).catch(() => ({ collections: [] })),
    listCategories().catch(() => []),
  ])

  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: absoluteUrl(`/${countryCode}/products/${p.handle}`),
    lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
    changeFrequency: "weekly",
    priority: 0.8,
  }))

  const collectionEntries: MetadataRoute.Sitemap = (
    collectionsResult.collections ?? []
  )
    .filter((c) => c.handle)
    .map((c) => ({
      url: absoluteUrl(`/${countryCode}/collections/${c.handle}`),
      lastModified: c.updated_at ? new Date(c.updated_at) : now,
      changeFrequency: "weekly",
      priority: 0.7,
    }))

  const categoryEntries: MetadataRoute.Sitemap = (categories ?? [])
    .filter((c) => c.handle)
    .map((c) => ({
      url: absoluteUrl(`/${countryCode}/categories/${c.handle}`),
      lastModified: c.updated_at ? new Date(c.updated_at) : now,
      changeFrequency: "weekly",
      priority: 0.7,
    }))

  return [
    ...staticEntries,
    ...productEntries,
    ...collectionEntries,
    ...categoryEntries,
  ]
}

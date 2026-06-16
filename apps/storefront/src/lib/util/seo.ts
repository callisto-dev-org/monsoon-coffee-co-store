import { HttpTypes } from "@medusajs/types"
import { getBaseURL } from "@lib/util/env"

/**
 * Central SEO/brand constants. Reused across metadata exports and JSON-LD
 * structured data so the site name, tagline and social image live in one place.
 */
export const SITE = {
  name: "Monsoon Coffee Co.",
  tagline: "Small batch specialty coffee",
  description:
    "Small batch, specialty coffee — roasted with obsession. Freshly roasted beans, single origins and brew gear from the Monsoon roastery.",
  defaultOgImage: "/monsoon/images/coffeebags.png",
  logo: "/monsoon/images/logo.png",
  keywords: [
    "specialty coffee",
    "single origin coffee",
    "freshly roasted coffee",
    "small batch coffee",
    "coffee beans",
    "coffee roastery",
    "Monsoon Coffee",
  ],
  // Social profiles — fill in as they exist.
  sameAs: [] as string[],
} as const

/** Build an absolute URL from a site-relative path using the configured base URL. */
export const absoluteUrl = (path = "/"): string => {
  const base = getBaseURL().replace(/\/$/, "")
  return `${base}${path.startsWith("/") ? path : `/${path}`}`
}

type JsonLd = Record<string, unknown>

/** schema.org Organization — emitted once on the homepage. */
export const organizationJsonLd = (): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE.name,
  url: absoluteUrl("/"),
  logo: absoluteUrl(SITE.logo),
  description: SITE.description,
  ...(SITE.sameAs.length ? { sameAs: SITE.sameAs } : {}),
})

/** schema.org WebSite — enables the site name in search results. */
export const websiteJsonLd = (countryCode?: string): JsonLd => {
  const storePath = countryCode ? `/${countryCode}/store` : "/store"
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: absoluteUrl("/"),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl(storePath)}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }
}

/** schema.org BreadcrumbList from an ordered list of {name, url} items. */
export const breadcrumbJsonLd = (
  items: { name: string; url: string }[]
): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
})

const isVariantPurchasable = (variant: HttpTypes.StoreProductVariant): boolean => {
  if (variant.manage_inventory === false) {
    return true
  }
  if (variant.allow_backorder) {
    return true
  }
  return (variant.inventory_quantity ?? 0) > 0
}

/**
 * schema.org Product with one Offer per purchasable variant. `product` is the
 * region-priced product (variants carry calculated_price), so price + currency
 * come straight off the variant.
 */
export const productJsonLd = (
  product: HttpTypes.StoreProduct,
  region: HttpTypes.StoreRegion,
  url: string
): JsonLd => {
  const images = (product.images ?? [])
    .map((img) => img.url)
    .filter((u): u is string => Boolean(u))

  const offers = (product.variants ?? [])
    .map((variant) => {
      const amount = variant.calculated_price?.calculated_amount
      if (amount == null) {
        return null
      }
      const currency =
        variant.calculated_price?.currency_code ?? region.currency_code

      return {
        "@type": "Offer",
        price: amount,
        priceCurrency: currency?.toUpperCase(),
        availability: isVariantPurchasable(variant)
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        url,
        ...(variant.sku ? { sku: variant.sku } : {}),
      }
    })
    .filter(Boolean)

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description:
      product.description ?? product.subtitle ?? `${product.title} from ${SITE.name}`,
    ...(images.length ? { image: images } : {}),
    ...(product.material ? { material: product.material } : {}),
    brand: {
      "@type": "Brand",
      name: SITE.name,
    },
    ...(offers.length ? { offers } : {}),
  }
}

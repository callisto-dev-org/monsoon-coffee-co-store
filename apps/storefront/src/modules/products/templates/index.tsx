import React from "react"
import dynamic from "next/dynamic"

import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

import MonsoonProductInfo from "@modules/products/components/monsoon-product-info"
import MonsoonProductCarousel from "@modules/products/components/monsoon-carousel"
import MonsoonCoffeeSpec from "@modules/products/components/monsoon-coffee-spec"
import MonsoonEventDetail from "@modules/products/components/monsoon-event-detail"
import MonsoonLoader from "@modules/common/components/monsoon/loader"
import { isBrewLabEnabledForProduct, listProductBrews } from "@lib/data/brews"
import { getProductCoffeeProfile } from "@lib/data/coffee-profiles"
import { getProductEventDetail } from "@lib/data/event-details"
import { listProductReviews } from "@lib/data/reviews"

const MonsoonBrewLab = dynamic(
  () => import("@modules/products/components/monsoon-brew-lab"),
  {
    loading: () => (
      <div className="flex h-[480px] w-full items-center justify-center bg-surface">
        <MonsoonLoader label="Loading brew lab" />
      </div>
    ),
  }
)

const MonsoonReviews = dynamic(
  () => import("@modules/products/components/monsoon-reviews"),
  {
    loading: () => (
      <div className="flex h-[420px] w-full items-center justify-center bg-surface">
        <MonsoonLoader label="Loading reviews" />
      </div>
    ),
  }
)

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
  isAuthenticated: boolean
  cart: HttpTypes.StoreCart | null
}

const ProductTemplate = async ({
  product,
  region,
  countryCode,
  isAuthenticated,
  cart,
}: ProductTemplateProps) => {
  if (!product || !product.id) {
    return notFound()
  }

  // Marquee copy is driven by the product's subtitle (the "secondary" field in
  // the admin) — split on common separators so a subtitle like
  // "Direct Trade, Wild Ember, Freshly Roasted" scrolls as separate chips.
  // No subtitle → no copy → the carousel removes itself.
  const highlightItems = ((product as { subtitle?: string | null }).subtitle ?? "")
    .split(/[,.|•·/]+/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)

  const [brews, reviewsData, coffeeProfile, brewLabEnabled, eventDetail] =
    await Promise.all([
      listProductBrews(product.id),
      listProductReviews(product.id),
      getProductCoffeeProfile(product.id),
      isBrewLabEnabledForProduct({
        categories:
          (product as { categories?: Array<{ id?: string; handle?: string }> })
            .categories ?? null,
      }),
      getProductEventDetail(product.id),
    ])

  const productCategories =
    (product as {
      categories?: Array<{
        id?: string | null
        handle?: string | null
        name?: string | null
      }>
    }).categories ?? []

  const isCoffeeBeans = productCategories.some((c) => {
    const handle = (c?.handle ?? "").toLowerCase()
    const name = (c?.name ?? "").toLowerCase()
    return (
      handle === "coffee-beans" ||
      handle === "coffee" ||
      name === "coffee beans" ||
      name === "coffee"
    )
  })

  return (
    <main className="flex flex-col items-center justify-center">
      <MonsoonProductInfo
        product={product}
        region={region}
        isAuthenticated={isAuthenticated}
        cart={cart}
        coffeeProfile={coffeeProfile}
        isCoffeeBeans={isCoffeeBeans}
      />
      {eventDetail && <MonsoonEventDetail event={eventDetail} />}
      <MonsoonProductCarousel items={highlightItems} />
      {coffeeProfile && !isCoffeeBeans && (
        <MonsoonCoffeeSpec profile={coffeeProfile} />
      )}
      {brewLabEnabled && <MonsoonBrewLab brews={brews} />}
      <div id="reviews" className="w-full">
        <MonsoonReviews
          productId={product.id}
          productHandle={product.handle ?? ""}
          productTitle={product.title}
          productSubtitle={(product as any).subtitle ?? null}
          productImages={(product.images ?? [])
            .map((i) => i.url)
            .filter((u): u is string => Boolean(u))}
          productVariants={(product.variants ?? [])
            .filter((v): v is NonNullable<typeof v> => Boolean(v?.id))
            .map((v) => ({ id: v.id, title: v.title ?? "Variant" }))}
          countryCode={countryCode}
          isAuthenticated={isAuthenticated}
          initialReviews={reviewsData.reviews}
          initialSummary={reviewsData.summary}
        />
      </div>
    </main>
  )
}

export default ProductTemplate

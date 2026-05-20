import React from "react"
import dynamic from "next/dynamic"

import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

import MonsoonProductInfo from "@modules/products/components/monsoon-product-info"
import MonsoonProductCarousel from "@modules/products/components/monsoon-carousel"
import { listProductBrews } from "@lib/data/brews"
import { listProductReviews } from "@lib/data/reviews"

const MonsoonBrewLab = dynamic(
  () => import("@modules/products/components/monsoon-brew-lab"),
  {
    loading: () => (
      <div className="h-[480px] w-full animate-pulse bg-surface/40" aria-hidden />
    ),
  }
)

const MonsoonReviews = dynamic(
  () => import("@modules/products/components/monsoon-reviews"),
  {
    loading: () => (
      <div className="h-[420px] w-full animate-pulse bg-surface/40" aria-hidden />
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

  const highlightItems = [
    "FRESHLY ROASTED",
    "SMALL BATCH",
    "DIRECT TRADE",
    product.title?.toUpperCase() ?? "MONSOON BLEND",
  ]

  const [brews, reviewsData] = await Promise.all([
    listProductBrews(product.id),
    listProductReviews(product.id),
  ])

  return (
    <main className="flex flex-col items-center justify-center">
      <MonsoonProductInfo
        product={product}
        region={region}
        isAuthenticated={isAuthenticated}
        cart={cart}
      />
      <MonsoonProductCarousel items={highlightItems} />
      <MonsoonBrewLab brews={brews} />
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

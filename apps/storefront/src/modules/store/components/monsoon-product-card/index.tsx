import Image from "next/image"
import { HttpTypes } from "@medusajs/types"
import { getProductPrice } from "@lib/util/get-product-price"
import { HighlightCard } from "@modules/common/components/monsoon/highlight-card"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ProductCardProps = {
  product: HttpTypes.StoreProduct
}

export default function MonsoonProductCard({ product }: ProductCardProps) {
  const { cheapestPrice } = getProductPrice({ product })
  const thumbnail = product.thumbnail || "/monsoon/images/coffeebags.png"
  const originProcess = (product.tags ?? [])
    .map((t) => t.value?.toUpperCase())
    .filter(Boolean)
    .slice(0, 2)
    .join(" . ")
  const notes =
    product.subtitle ||
    product.description?.replace(/\s+/g, " ").slice(0, 90) ||
    ""

  return (
    <article className="group flex h-fit w-full flex-col gap-4 font-family-heading transition-transform duration-300 hover:-translate-y-1">
      <LocalizedClientLink
        href={`/products/${product.handle}`}
        className="flex min-w-0 flex-1 flex-col gap-4 sm:gap-6"
      >
        <HighlightCard className="mx-auto w-3/4 overflow-hidden transition-shadow duration-300 group-hover:shadow-[16px_16px_0px_0px_var(--mc-ink)] sm:w-full">
          <Image
            src={thumbnail}
            alt={product.title}
            width={400}
            height={500}
            className="h-full w-full aspect-[275/346] object-cover shadow-[8px_8px_0px_0px_var(--mc-ink)] transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </HighlightCard>
        <span className="flex min-w-0 flex-1 flex-col justify-between gap-3 py-1 sm:gap-2 sm:py-0">
          <span className="text-xs font-semibold uppercase tracking-widest text-accent">
            {originProcess || "SINGLE ORIGIN"}
          </span>
          <span className="flex items-start gap-3">
            <span className="w-full text-lg font-bold text-ink sm:text-2xl md:w-4/6 uppercase">
              {product.title}
            </span>
            <span className="ml-auto whitespace-nowrap text-base font-black sm:text-2xl">
              {cheapestPrice?.calculated_price ?? ""}
            </span>
          </span>
          <span className="font-family-base text-sm leading-6 text-ink/50 transition-colors duration-300 group-hover:text-ink/70 sm:text-base">
            {notes}
          </span>
        </span>
      </LocalizedClientLink>
      <LocalizedClientLink
        href={`/products/${product.handle}`}
        className="flex w-full shrink-0 items-center justify-center bg-ink px-4 py-4 text-center uppercase font-semibold tracking-widest text-white transition-colors hover:bg-accent sm:w-40 md:w-full"
      >
        View Product
      </LocalizedClientLink>
    </article>
  )
}

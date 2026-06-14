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
  // Eyebrow falls back to the product's category name when there are no tags
  // to show. (Subtitle is intentionally never used here.)
  const categoryName = product.categories?.[0]?.name?.toUpperCase()
  const notes = product.description?.replace(/\s+/g, " ").slice(0, 90) || ""

  return (
    <article className="group flex h-full w-full min-w-0 flex-col gap-3 font-family-heading transition-transform duration-300 hover:-translate-y-1 sm:gap-4">
      <LocalizedClientLink
        href={`/products/${product.handle}`}
        className="flex min-w-0 flex-1 flex-col gap-3 sm:gap-5"
      >
        <HighlightCard
          size="sm"
          className="overflow-hidden transition-shadow duration-300 group-hover:shadow-[6px_6px_var(--mc-ink)] sm:group-hover:shadow-[10px_10px_var(--mc-ink)] lg:group-hover:shadow-[16px_16px_var(--mc-ink)]"
        >
          <Image
            src={thumbnail}
            alt={product.title}
            width={400}
            height={500}
            loading="lazy"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1536px) 25vw, 320px"
            className="aspect-[275/346] h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </HighlightCard>
        <span className="flex min-w-0 flex-1 flex-col gap-1.5 py-1 sm:gap-2 sm:py-0">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent sm:text-xs sm:tracking-widest">
            {originProcess || categoryName || "SINGLE ORIGIN"}
          </span>
          <span className="line-clamp-2 min-w-0 min-h-[2.2em] text-sm font-bold uppercase leading-tight text-ink sm:min-h-[2.4em] sm:text-xl lg:text-2xl">
            {product.title}
          </span>
          <span className="whitespace-nowrap font-family-heading text-sm font-black tabular-nums text-ink sm:text-lg lg:text-2xl">
            {cheapestPrice?.calculated_price ?? ""}
          </span>
          <span className="hidden font-family-base text-sm leading-6 text-ink/50 transition-colors duration-300 group-hover:text-ink/70 sm:line-clamp-2 sm:min-h-[3rem] sm:text-base">
            {notes}
          </span>
        </span>
      </LocalizedClientLink>
      <LocalizedClientLink
        href={`/products/${product.handle}`}
        className="mt-auto flex w-full shrink-0 items-center justify-center bg-ink px-3 py-3 text-center text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-accent sm:px-4 sm:py-4 sm:text-sm md:text-base"
      >
        View Product
      </LocalizedClientLink>
    </article>
  )
}

import Image from "next/image"
import { HttpTypes } from "@medusajs/types"
import { listProducts } from "@lib/data/products"
import { getProductPrice } from "@lib/util/get-product-price"
import { HighlightCard } from "@modules/common/components/monsoon/highlight-card"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

function FeaturedProductCard({ product }: { product: HttpTypes.StoreProduct }) {
  const { cheapestPrice } = getProductPrice({ product })
  const thumbnail = product.thumbnail || "/monsoon/images/coffeebags.png"
  const tags = (product.tags ?? []).map((t) => t.value).join(", ")

  return (
    <HighlightCard className="flex w-full min-w-0 flex-col gap-4 bg-surface p-4 sm:p-6">
      <span className="relative aspect-square w-full overflow-hidden">
        <span className="absolute left-2 top-2 z-20 bg-accent px-2 py-1 font-family-heading text-[10px] font-semibold uppercase text-surface sm:px-4 sm:text-sm">
          Details
        </span>
        <Image
          src={thumbnail}
          alt={product.title}
          width={400}
          height={500}
          className="h-full w-full object-cover"
        />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-3">
        <span className="flex min-w-0 flex-col gap-1.5">
          <span className="min-w-0 truncate font-family-base text-base font-bold uppercase text-ink sm:text-xl lg:text-2xl">
            {product.title}
          </span>
          <span className="whitespace-nowrap font-family-base text-base font-black tabular-nums text-ink sm:text-lg lg:text-2xl">
            {cheapestPrice?.calculated_price ?? ""}
          </span>
          <span className="line-clamp-2 min-w-0 font-family-base text-[11px] uppercase leading-snug tracking-tight text-[var(--mc-secondary)] sm:text-sm">
            {tags
              ? `NOTES: ${tags.toUpperCase()}`
              : product.subtitle ?? product.description ?? ""}
          </span>
        </span>
        <LocalizedClientLink href={`/products/${product.handle}`}>
          <button
            type="button"
            className="w-full cursor-pointer bg-ink p-3 font-family-heading text-sm font-semibold uppercase text-surface transition-colors hover:bg-accent sm:p-4 sm:text-lg"
          >
            View Product
          </button>
        </LocalizedClientLink>
      </span>
    </HighlightCard>
  )
}

export default async function CurrentLedger({
  countryCode,
}: {
  countryCode: string
}) {
  const { response } = await listProducts({
    countryCode,
    queryParams: { limit: 3 },
  }).catch(() => ({ response: { products: [], count: 0 }, nextPage: null }))

  if (!response.products.length) {
    return null
  }

  return (
    <section className="flex flex-col gap-8 overflow-x-clip px-5 py-14 sm:px-10 sm:py-16 lg:gap-12 lg:px-20 lg:py-20">
      <span className="flex w-full flex-col gap-4 border-b-4 border-ink pb-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <span className="font-family-heading text-4xl font-bold uppercase leading-[0.9] sm:text-5xl lg:text-6xl">
          Current <br /> Stash
        </span>
        <LocalizedClientLink
          href="/store"
          className="group/all inline-flex shrink-0 items-center gap-2 font-family-base text-xs font-semibold uppercase tracking-tight text-[var(--mc-secondary)] transition-colors hover:text-ink sm:text-sm"
        >
          View all products
          <span aria-hidden className="transition-transform group-hover/all:translate-x-1">
            →
          </span>
        </LocalizedClientLink>
      </span>
      <div className="grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {response.products.map((product) => (
          <FeaturedProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}

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
    <HighlightCard className="flex w-full flex-row gap-4 bg-surface p-5 sm:p-6 max-sm:flex-col md:flex-col">
      <span className="relative aspect-[4/5] w-2/5 h-fit overflow-hidden max-sm:mx-auto max-sm:w-full md:w-full">
        <span className="absolute left-2 top-2 z-20 bg-accent px-3 py-1 font-family-heading text-xs font-semibold uppercase text-surface sm:px-4 sm:text-sm">
          Details
        </span>
        <Image
          src={thumbnail}
          alt={product.title}
          width={400}
          height={500}
          className="h-fit w-full object-cover"
        />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-4">
        <span className="flex flex-col gap-2">
          <span className="font-family-base flex w-full max-sm:flex-row flex-col md:flex-row items-start text-lg font-bold sm:text-xl lg:text-2xl">
            <span className="min-w-0 truncate uppercase">{product.title}</span>
            <span className="md:ml-auto max-sm:ml-auto m-0 shrink-0 text-start">
              {cheapestPrice?.calculated_price ?? ""}
            </span>
          </span>
          <span className="font-family-base text-sm tracking-tight text-[var(--mc-secondary)] uppercase">
            {tags
              ? `NOTES: ${tags.toUpperCase()}`
              : product.subtitle ?? product.description?.slice(0, 60) ?? ""}
          </span>
        </span>
        <LocalizedClientLink href={`/products/${product.handle}`}>
          <button
            type="button"
            className="w-full bg-ink p-3 font-family-heading text-base font-semibold uppercase text-surface transition-colors hover:bg-accent sm:p-4 sm:text-lg cursor-pointer"
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
    <section className="flex flex-col gap-8 px-6 py-14 sm:px-10 sm:py-16 lg:gap-12 lg:px-20 lg:py-20">
      <span className="flex w-full gap-4 border-b-4 border-ink pb-4 flex-row sm:items-end sm:justify-center">
        <span className="font-family-heading text-4xl font-bold uppercase leading-[0.9] sm:text-5xl lg:text-6xl">
          Current <br /> Ledger
        </span>
        <span className="ml-0 text-end w-full font-family-base text-xs font-medium tracking-tight text-[var(--mc-secondary)] sm:ml-auto sm:text-end sm:text-sm">
          DIRECT ACQUISITION <br />
          FROM MICRO-LOTS. NO <br />
          SUBSCRIPTIONS. ONLY <br />
          EXCELLENCE.
        </span>
      </span>
      <div className="grid w-full gap-6 xl:grid-cols-3 xl:gap-8">
        {response.products.map((product) => (
          <FeaturedProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}

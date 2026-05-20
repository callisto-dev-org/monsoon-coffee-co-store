import Image from "next/image"
import { HttpTypes } from "@medusajs/types"
import { listProducts } from "@lib/data/products"
import { getProductPrice } from "@lib/util/get-product-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

function RecommendedCard({ product }: { product: HttpTypes.StoreProduct }) {
  const { cheapestPrice } = getProductPrice({ product })
  const thumbnail = product.thumbnail || "/monsoon/images/coffeebags.png"

  return (
    <article className="group border border-ink bg-surface p-4 text-ink transition-colors duration-200 hover:bg-ink hover:text-surface">
      <div className="relative h-80 w-full border border-ink/70">
        <Image
          src={thumbnail}
          alt={product.title}
          fill
          className="object-cover"
        />
      </div>

      <div className="mt-4 font-family-heading">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-2xl sm:text-3xl font-bold uppercase leading-none">
            {product.title}
          </h3>
          <p className="text-2xl sm:text-3xl font-black text-[var(--mc-primary)]">
            {cheapestPrice?.calculated_price ?? ""}
          </p>
        </div>
        <p className="mt-2 text-base text-ink/50 transition-colors duration-200 group-hover:text-surface/70 line-clamp-2">
          {product.subtitle ?? product.description?.slice(0, 80) ?? ""}
        </p>

        <LocalizedClientLink
          href={`/products/${product.handle}`}
          className="mt-6 inline-flex w-full justify-center border border-ink py-3 text-xs font-extrabold uppercase tracking-[0.18em] text-ink transition-colors duration-200 group-hover:border-surface/80 group-hover:text-surface"
        >
          View Product
        </LocalizedClientLink>
      </div>
    </article>
  )
}

export default async function MonsoonRecommended({
  countryCode,
  excludeIds,
}: {
  countryCode: string
  excludeIds?: string[]
}) {
  const { response } = await listProducts({
    countryCode,
    queryParams: { limit: 6 },
  }).catch(() => ({ response: { products: [], count: 0 }, nextPage: null }))

  const filtered = response.products
    .filter((p) => !excludeIds?.includes(p.id))
    .slice(0, 3)

  if (!filtered.length) return null

  return (
    <section className="mt-16 sm:mt-24">
      <div className="flex items-center gap-4">
        <h2 className="shrink-0 font-family-heading text-2xl font-black uppercase text-ink sm:text-4xl lg:text-6xl">
          You Might Also Like
        </h2>
        <span className="h-px w-full bg-ink/25" />
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:gap-8">
        {filtered.map((p) => (
          <RecommendedCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}

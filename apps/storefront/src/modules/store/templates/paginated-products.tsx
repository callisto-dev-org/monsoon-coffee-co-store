import { listProductsWithSort } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import MonsoonProductCard from "@modules/store/components/monsoon-product-card"
import { Pagination } from "@modules/store/components/pagination"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

const PRODUCT_LIMIT = 12

type PaginatedProductsParams = {
  limit: number
  collection_id?: string[]
  category_id?: string[]
  id?: string[]
  tag_id?: string[]
  order?: string
}

export default async function PaginatedProducts({
  sortBy,
  page,
  collectionId,
  categoryId,
  productsIds,
  tagIds,
  countryCode,
}: {
  sortBy?: SortOptions
  page: number
  collectionId?: string
  categoryId?: string
  productsIds?: string[]
  tagIds?: string[]
  countryCode: string
}) {
  const queryParams: PaginatedProductsParams = {
    limit: 12,
  }

  if (collectionId) {
    queryParams["collection_id"] = [collectionId]
  }

  if (categoryId) {
    queryParams["category_id"] = [categoryId]
  }

  if (productsIds) {
    queryParams["id"] = productsIds
  }

  if (tagIds && tagIds.length > 0) {
    queryParams["tag_id"] = tagIds
  }

  if (sortBy === "created_at") {
    queryParams["order"] = "created_at"
  }

  const region = await getRegion(countryCode).catch(() => null)

  if (!region) {
    return (
      <p className="border-2 border-ink/30 bg-surface p-6 font-family-base text-base text-ink/60">
        Can&apos;t reach the roastery for region &ldquo;{countryCode}&rdquo;.
        Make sure the Medusa backend is running.
      </p>
    )
  }

  const sortResult = await listProductsWithSort({
    page,
    queryParams,
    sortBy,
    countryCode,
  }).catch((e: unknown) => e as Error)

  if (sortResult instanceof Error) {
    return (
      <p className="border-2 border-red-700 bg-red-50 p-6 font-family-heading text-xs font-bold uppercase tracking-[0.14em] text-red-700">
        Couldn&apos;t load products: {sortResult.message}
      </p>
    )
  }

  const {
    response: { products, count },
  } = sortResult

  const totalPages = Math.ceil(count / PRODUCT_LIMIT)

  return (
    <>
      <span className="flex border-b-2 border-ink/10 py-4 text-base font-semibold tracking-tight text-ink/30 sm:text-lg lg:py-6">
        <span className="uppercase">SHOWING {count} Results</span>
      </span>
      <div className="flex py-2 sm:py-4 lg:py-6">
        <div
          className="grid w-full grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 lg:gap-8 2xl:grid-cols-4"
          data-testid="products-list"
        >
          {products.map((p) => (
            <MonsoonProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
      {totalPages > 1 && (
        <Pagination
          data-testid="product-pagination"
          page={page}
          totalPages={totalPages}
        />
      )}
    </>
  )
}

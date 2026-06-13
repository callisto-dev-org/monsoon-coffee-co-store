import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import MonsoonFilter from "@modules/store/components/monsoon-filter"
import { listFilterCategories } from "@lib/data/filter-categories"
import { listCategories } from "@lib/data/categories"

import PaginatedProducts from "./paginated-products"

const StoreTemplate = async ({
  sortBy,
  page,
  tagIds,
  categoryIds,
  countryCode,
}: {
  sortBy?: SortOptions
  page?: string
  tagIds?: string[]
  categoryIds?: string[]
  countryCode: string
}) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  const [filterCategories, allCategories] = await Promise.all([
    listFilterCategories(),
    listCategories({ fields: "id,name,rank", limit: 100 }).catch(() => []),
  ])

  // Always offer a "Category" filter listing every product category.
  const productCategories = (allCategories ?? [])
    .filter((c) => c?.id && c?.name)
    .map((c) => ({ id: c.id as string, name: c.name as string }))

  return (
    <div
      className="flex min-h-screen w-full flex-col font-family-heading"
      data-testid="category-container"
    >
      <div className="flex w-full flex-col gap-5 border-b-2 border-ink px-4 py-10 sm:gap-6 sm:px-8 sm:py-16 lg:flex-row lg:items-end lg:px-12 lg:py-20">
        <span className="flex flex-col gap-2">
          <span className="text-sm uppercase font-medium tracking-widest text-accent sm:text-base">
            Current Catalogue
          </span>
          <span className="max-w-xl uppercase text-3xl font-bold leading-[0.9] text-ink sm:text-5xl lg:text-7xl">
            OUR LATEST <br /> OFFERINGS
          </span>
        </span>
        <span className="max-w-2xl text-sm font-medium leading-6 tracking-wide text-[var(--mc-secondary)] opacity-80 sm:text-base sm:tracking-widest lg:ml-auto lg:w-1/3 lg:text-base">
          Our definitive record of every bean currently passing through the
          roastery. Filtered by origin, graded by profile, and tracked from
          harvest to bag.
        </span>
      </div>
      <div className="flex flex-col gap-8 px-4 py-8 sm:px-8 sm:py-10 lg:flex-row lg:gap-12 lg:px-12 lg:py-20">
        <MonsoonFilter
          categories={filterCategories}
          productCategories={productCategories}
          className="w-full uppercase lg:w-1/5 lg:p-8"
        />
        <div className="flex h-fit w-full flex-col gap-4 py-2 lg:py-8 lg:pr-12">
          <Suspense
            key={`${sort}-${pageNumber}-${(tagIds ?? []).join(",")}-${(
              categoryIds ?? []
            ).join(",")}`}
            fallback={<SkeletonProductGrid numberOfProducts={12} />}
          >
            <PaginatedProducts
              sortBy={sort}
              page={pageNumber}
              tagIds={tagIds}
              categoryIds={categoryIds}
              countryCode={countryCode}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

export default StoreTemplate

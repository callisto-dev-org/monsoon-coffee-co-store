import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"

export default function Loading() {
  return (
    <div className="flex min-h-screen w-full flex-col font-family-heading">
      {/* Header */}
      <div className="flex w-full flex-col gap-5 border-b-2 border-ink px-4 py-10 sm:gap-6 sm:px-8 sm:py-16 lg:flex-row lg:items-end lg:px-12 lg:py-20">
        <span className="flex animate-pulse flex-col gap-3">
          <span className="h-4 w-40 bg-accent/30" />
          <span className="h-10 w-64 bg-ink/10 sm:h-16 sm:w-[26rem] lg:h-24 lg:w-[34rem]" />
        </span>
        <span className="hidden h-14 w-1/3 animate-pulse bg-ink/5 lg:ml-auto lg:block" />
      </div>

      {/* Filter sidebar + product grid */}
      <div className="flex flex-col gap-8 px-4 py-8 sm:px-8 sm:py-10 lg:flex-row lg:gap-12 lg:px-12 lg:py-20">
        <div className="hidden w-full animate-pulse flex-col gap-4 lg:flex lg:w-1/5">
          <span className="h-5 w-24 bg-ink/15" />
          <span className="h-10 w-full bg-ink/5" />
          <span className="h-10 w-full bg-ink/5" />
          <span className="h-10 w-3/4 bg-ink/5" />
        </div>
        <div className="flex h-fit w-full flex-col gap-4 py-2 lg:py-8 lg:pr-12">
          <span className="h-6 w-40 animate-pulse bg-ink/10" />
          <SkeletonProductGrid numberOfProducts={12} />
        </div>
      </div>
    </div>
  )
}

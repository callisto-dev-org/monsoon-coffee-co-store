import repeat from "@lib/util/repeat"
import MonsoonProductCardSkeleton from "@modules/skeletons/components/monsoon-product-card"

const SkeletonProductGrid = ({
  numberOfProducts = 8,
}: {
  numberOfProducts?: number
}) => {
  return (
    <div
      className="grid w-full grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 lg:gap-8 2xl:grid-cols-4"
      data-testid="products-list-loader"
    >
      {repeat(numberOfProducts).map((index) => (
        <MonsoonProductCardSkeleton key={index} />
      ))}
    </div>
  )
}

export default SkeletonProductGrid

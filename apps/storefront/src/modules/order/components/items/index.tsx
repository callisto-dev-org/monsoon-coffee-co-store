import repeat from "@lib/util/repeat"
import { HttpTypes } from "@medusajs/types"

import Item from "@modules/order/components/item"

type ItemsProps = {
  order: HttpTypes.StoreOrder
}

const ItemSkeleton = () => (
  <div className="flex items-center gap-4 py-5 sm:gap-6">
    <div className="h-20 w-20 animate-pulse border-2 border-ink/15 bg-ink/10 sm:h-24 sm:w-24" />
    <div className="flex flex-1 flex-col gap-2">
      <div className="h-4 w-40 animate-pulse bg-ink/10" />
      <div className="h-3 w-24 animate-pulse bg-ink/10" />
    </div>
    <div className="flex flex-col items-end gap-2">
      <div className="h-3 w-16 animate-pulse bg-ink/10" />
      <div className="h-4 w-20 animate-pulse bg-ink/10" />
    </div>
  </div>
)

const Items = ({ order }: ItemsProps) => {
  const items = order.items

  return (
    <div className="flex flex-col divide-y-2 divide-ink/10 border-y-2 border-ink/10">
      {items?.length
        ? items
            .sort((a, b) => {
              return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
            })
            .map((item) => {
              return (
                <Item
                  key={item.id}
                  item={item}
                  currencyCode={order.currency_code}
                />
              )
            })
        : repeat(5).map((i) => <ItemSkeleton key={i} />)}
    </div>
  )
}

export default Items

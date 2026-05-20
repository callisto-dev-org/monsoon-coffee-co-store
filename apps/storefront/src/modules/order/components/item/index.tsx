import { HttpTypes } from "@medusajs/types"

import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import Thumbnail from "@modules/products/components/thumbnail"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  currencyCode: string
}

const Item = ({ item, currencyCode }: ItemProps) => {
  return (
    <div
      className="flex items-center gap-4 py-5 sm:gap-6"
      data-testid="product-row"
    >
      <div className="w-20 border-2 border-ink/15 bg-surface sm:w-24">
        <Thumbnail thumbnail={item.thumbnail} size="square" />
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <span
          className="font-family-heading text-base font-bold uppercase tracking-tight text-ink sm:text-lg"
          data-testid="product-name"
        >
          {item.product_title}
        </span>
        <span className="font-family-base text-sm text-ink/55">
          <LineItemOptions
            variant={item.variant}
            data-testid="product-variant"
          />
        </span>
      </div>

      <div className="flex flex-col items-end justify-center gap-1">
        <div className="flex items-center gap-x-1 font-family-base text-sm text-ink/55">
          <span data-testid="product-quantity">{item.quantity}</span>x
          <LineItemUnitPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
          />
        </div>
        <span className="font-family-heading text-base font-bold text-ink">
          <LineItemPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
          />
        </span>
      </div>
    </div>
  )
}

export default Item

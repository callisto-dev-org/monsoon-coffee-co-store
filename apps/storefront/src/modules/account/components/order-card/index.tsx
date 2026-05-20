import { useMemo } from "react"

import Thumbnail from "@modules/products/components/thumbnail"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type OrderCardProps = {
  order: HttpTypes.StoreOrder
}

const OrderCard = ({ order }: OrderCardProps) => {
  const numberOfLines = useMemo(() => {
    return (
      order.items?.reduce((acc, item) => {
        return acc + item.quantity
      }, 0) ?? 0
    )
  }, [order])

  const numberOfProducts = useMemo(() => {
    return order.items?.length ?? 0
  }, [order])

  return (
    <article
      className="flex flex-col border-2 border-ink bg-surface p-6 shadow-[4px_4px_0px_0px_var(--mc-ink)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_var(--mc-ink)]"
      data-testid="order-card"
    >
      <div className="flex flex-col gap-3 border-b-2 border-ink/15 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-family-heading text-xs font-bold uppercase tracking-[0.1em] text-ink/45">
            Order
          </p>
          <h3 className="mt-1 font-family-heading text-2xl font-black uppercase text-ink sm:text-3xl">
            #<span data-testid="order-display-id">{order.display_id}</span>
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-family-base text-sm text-ink/65 sm:text-base">
          <span data-testid="order-created-at">
            {new Date(order.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric",
            })}
          </span>
          <span className="text-ink/30">/</span>
          <span
            className="font-family-heading font-bold uppercase text-ink"
            data-testid="order-amount"
          >
            {convertToLocale({
              amount: order.total,
              currency_code: order.currency_code,
            })}
          </span>
          <span className="text-ink/30">/</span>
          <span>{`${numberOfLines} ${numberOfLines > 1 ? "items" : "item"}`}</span>
        </div>
      </div>

      <div className="my-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {order.items?.slice(0, 3).map((i) => {
          return (
            <div
              key={i.id}
              className="flex flex-col gap-y-2"
              data-testid="order-item"
            >
              <div className="border-2 border-ink/15 bg-surface">
                <Thumbnail thumbnail={i.thumbnail} images={[]} size="full" />
              </div>
              <div className="flex items-center gap-x-1 font-family-base text-sm text-ink/85">
                <span
                  className="truncate font-family-heading font-bold uppercase text-ink"
                  data-testid="item-title"
                >
                  {i.title}
                </span>
                <span className="text-ink/45">x</span>
                <span data-testid="item-quantity">{i.quantity}</span>
              </div>
            </div>
          )
        })}
        {numberOfProducts > 4 && (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-ink/30 bg-ink/5 font-family-heading text-base font-bold uppercase text-ink/55">
            <span>+ {numberOfLines - 4}</span>
            <span>more</span>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <LocalizedClientLink href={`/account/orders/details/${order.id}`}>
          <span
            className="inline-flex items-center border-2 border-ink bg-ink px-5 py-3 font-family-heading text-xs font-bold uppercase tracking-[0.08em] text-surface transition-all hover:bg-accent hover:border-accent"
            data-testid="order-details-link"
          >
            See details
          </span>
        </LocalizedClientLink>
      </div>
    </article>
  )
}

export default OrderCard

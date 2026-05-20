import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type OrderSummaryProps = {
  order: HttpTypes.StoreOrder
}

const OrderSummary = ({ order }: OrderSummaryProps) => {
  const getAmount = (amount?: number | null) => {
    if (!amount) {
      return
    }

    return convertToLocale({
      amount,
      currency_code: order.currency_code,
    })
  }

  const Row = ({
    label,
    value,
    accent = false,
  }: {
    label: string
    value?: string
    accent?: boolean
  }) => (
    <div className="flex items-center justify-between font-family-base text-base text-ink/75">
      <span>{label}</span>
      <span className={accent ? "text-accent" : ""}>{value}</span>
    </div>
  )

  return (
    <div>
      <h2 className="mb-6 font-family-heading text-2xl sm:text-3xl font-black uppercase text-ink">
        Order Summary
      </h2>
      <div className="flex flex-col gap-2">
        <Row label="Subtotal" value={getAmount(order.subtotal)} />
        {order.discount_total > 0 && (
          <Row
            label="Discount"
            value={`- ${getAmount(order.discount_total)}`}
            accent
          />
        )}
        {order.gift_card_total > 0 && (
          <Row
            label="Gift card"
            value={`- ${getAmount(order.gift_card_total)}`}
            accent
          />
        )}
        <Row label="Shipping" value={getAmount(order.shipping_total)} />
        <Row label="Taxes" value={getAmount(order.tax_total)} />
      </div>
      <div className="my-5 border-t-2 border-dashed border-ink/20" />
      <div className="flex items-center justify-between">
        <span className="font-family-heading text-base font-bold uppercase tracking-[0.06em] text-ink sm:text-lg">
          Total
        </span>
        <span className="font-family-heading text-2xl font-black text-ink sm:text-3xl">
          {getAmount(order.total)}
        </span>
      </div>
    </div>
  )
}

export default OrderSummary

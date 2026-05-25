import { paymentInfoMap } from "@lib/constants"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type PaymentDetailsProps = {
  order: HttpTypes.StoreOrder
}

const PaymentDetails = ({ order }: PaymentDetailsProps) => {
  const payment = order.payment_collections?.[0].payments?.[0]

  return (
    <div>
      <h2 className="mb-6 font-family-heading text-2xl sm:text-3xl font-black uppercase text-ink">
        Payment
      </h2>
      {payment && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <p className="font-family-heading text-xs font-bold uppercase tracking-[0.1em] text-ink/45">
              Payment method
            </p>
            <p
              className="font-family-heading text-base font-bold uppercase text-ink"
              data-testid="payment-method"
            >
              {paymentInfoMap[payment.provider_id].title}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-family-heading text-xs font-bold uppercase tracking-[0.1em] text-ink/45">
              Payment details
            </p>
            <div className="flex items-center gap-2">
              <div className="flex h-9 items-center border-2 border-ink/20 bg-ink/5 p-2">
                {paymentInfoMap[payment.provider_id].icon}
              </div>
              <span
                className="font-family-base text-base text-ink/85"
                data-testid="payment-amount"
              >
                {`${convertToLocale({
                  amount: payment.amount,
                  currency_code: order.currency_code,
                })} paid at ${new Date(
                  payment.created_at ?? ""
                ).toLocaleString()}`}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PaymentDetails

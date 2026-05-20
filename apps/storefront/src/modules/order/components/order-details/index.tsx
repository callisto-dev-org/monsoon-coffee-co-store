import { HttpTypes } from "@medusajs/types"

type OrderDetailsProps = {
  order: HttpTypes.StoreOrder
  showStatus?: boolean
}

const OrderDetails = ({ order, showStatus }: OrderDetailsProps) => {
  const formatStatus = (str: string) => {
    const formatted = str.split("_").join(" ")

    return formatted.slice(0, 1).toUpperCase() + formatted.slice(1)
  }

  const Field = ({
    label,
    children,
    testId,
  }: {
    label: string
    children: React.ReactNode
    testId?: string
  }) => (
    <div className="flex flex-col gap-1">
      <span className="font-family-heading text-xs font-bold uppercase tracking-[0.1em] text-ink/45">
        {label}
      </span>
      <span
        className="font-family-base text-base text-ink"
        data-testid={testId}
      >
        {children}
      </span>
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <p className="font-family-base text-base text-ink/75">
        We have sent the order confirmation details to{" "}
        <span
          className="font-family-heading font-bold uppercase tracking-[0.04em] text-accent"
          data-testid="order-email"
        >
          {order.email}
        </span>
        .
      </p>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Order date" testId="order-date">
          {new Date(order.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          })}
        </Field>
        <Field label="Order number" testId="order-id">
          #{order.display_id}
        </Field>
        {showStatus && (
          <>
            <Field label="Order status" testId="order-status">
              <span className="inline-flex border-2 border-accent/70 bg-[var(--mc-primary)]/20 px-3 py-1 font-family-heading text-sm font-bold uppercase tracking-[0.06em] text-accent">
                {formatStatus(order.fulfillment_status)}
              </span>
            </Field>
            <Field label="Payment status" testId="order-payment-status">
              <span className="inline-flex border-2 border-ink/40 bg-ink/5 px-3 py-1 font-family-heading text-sm font-bold uppercase tracking-[0.06em] text-ink">
                {formatStatus(order.payment_status)}
              </span>
            </Field>
          </>
        )}
      </div>
    </div>
  )
}

export default OrderDetails

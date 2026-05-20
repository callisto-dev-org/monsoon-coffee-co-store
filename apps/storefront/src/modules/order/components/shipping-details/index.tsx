import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type ShippingDetailsProps = {
  order: HttpTypes.StoreOrder
}

const ShippingDetails = ({ order }: ShippingDetailsProps) => {
  const Block = ({
    title,
    testId,
    children,
  }: {
    title: string
    testId: string
    children: React.ReactNode
  }) => (
    <div className="flex flex-col gap-1" data-testid={testId}>
      <p className="font-family-heading text-xs font-bold uppercase tracking-[0.1em] text-ink/45">
        {title}
      </p>
      <div className="font-family-base text-base text-ink/85">{children}</div>
    </div>
  )

  return (
    <div>
      <h2 className="mb-6 font-family-heading text-2xl sm:text-3xl font-black uppercase text-ink">
        Delivery
      </h2>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Block title="Shipping Address" testId="shipping-address-summary">
          <p className="font-family-heading text-base font-bold uppercase text-ink">
            {order.shipping_address?.first_name}{" "}
            {order.shipping_address?.last_name}
          </p>
          <p>
            {order.shipping_address?.address_1}{" "}
            {order.shipping_address?.address_2}
          </p>
          <p>
            {order.shipping_address?.postal_code},{" "}
            {order.shipping_address?.city}
          </p>
          <p className="uppercase">
            {order.shipping_address?.country_code?.toUpperCase()}
          </p>
        </Block>

        <Block title="Contact" testId="shipping-contact-summary">
          <p>{order.shipping_address?.phone}</p>
          <p>{order.email}</p>
        </Block>

        <Block title="Method" testId="shipping-method-summary">
          <p className="font-family-heading text-base font-bold uppercase text-ink">
            {(order.shipping_methods?.[0] as { name?: string })?.name}
          </p>
          <p className="text-ink/55">
            {convertToLocale({
              amount: order.shipping_methods?.[0].total ?? 0,
              currency_code: order.currency_code,
            })}
          </p>
        </Block>
      </div>
    </div>
  )
}

export default ShippingDetails

import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type ShippingDetailsProps = {
  order: HttpTypes.StoreOrder
}

const ShippingDetails = ({ order }: ShippingDetailsProps) => {
  const a = order.shipping_address
  const method = order.shipping_methods?.[0] as { name?: string } | undefined
  const shippingCost = order.shipping_methods?.[0]?.total ?? 0

  return (
    <div className="flex h-full flex-col gap-5">
      <div className="flex items-baseline justify-between">
        <h3 className="font-family-heading text-xs font-bold uppercase tracking-[0.2em] text-accent">
          Deliver To
        </h3>
        <span
          aria-hidden
          className="rotate-[-6deg] border-2 border-ink/40 px-2 py-[2px] font-family-heading text-[9px] font-black uppercase tracking-[0.18em] text-ink/45"
        >
          Stamp · {order.shipping_address?.country_code?.toUpperCase() ?? "IN"}
        </span>
      </div>

      <address
        className="not-italic font-family-base text-[15px] leading-relaxed text-ink"
        data-testid="shipping-address-summary"
      >
        <p className="font-family-heading text-base font-black uppercase tracking-wide text-ink">
          {a?.first_name} {a?.last_name}
        </p>
        <p>
          {a?.address_1}
          {a?.address_2 ? `, ${a.address_2}` : ""}
        </p>
        <p>
          {a?.city}
          {a?.province ? ` · ${a.province}` : ""}
        </p>
        <p className="font-mono tabular-nums">
          {a?.postal_code} · {a?.country_code?.toUpperCase()}
        </p>
      </address>

      <div className="grid grid-cols-2 gap-3 border-t-2 border-dashed border-ink/15 pt-4 text-[13px]">
        <Block label="Phone">
          <span
            className="font-mono tabular-nums text-ink"
            data-testid="shipping-contact-summary"
          >
            {a?.phone || "—"}
          </span>
        </Block>
        <Block label="Email">
          <span className="break-all text-ink">{order.email}</span>
        </Block>
        <Block label="Method">
          <span className="font-family-heading text-sm font-bold uppercase text-ink">
            {method?.name ?? "Standard"}
          </span>
        </Block>
        <Block label="Charge">
          <span className="font-mono tabular-nums text-ink">
            {convertToLocale({
              amount: shippingCost,
              currency_code: order.currency_code,
            })}
          </span>
        </Block>
      </div>
    </div>
  )
}

const Block = ({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) => (
  <div className="flex flex-col gap-1">
    <span className="font-family-heading text-[10px] font-bold uppercase tracking-[0.18em] text-ink/40">
      {label}
    </span>
    {children}
  </div>
)

export default ShippingDetails

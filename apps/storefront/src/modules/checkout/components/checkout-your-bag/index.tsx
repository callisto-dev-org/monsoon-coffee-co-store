"use client"

import Image from "next/image"
import { HttpTypes } from "@medusajs/types"

import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { usePincodeEstimate } from "@modules/checkout/components/pincode-estimate-context"

type Props = {
  cart: HttpTypes.StoreCart
}

export default function CheckoutYourBag({ cart }: Props) {
  const currency = cart.currency_code
  const hasShippingMethod = !!cart.shipping_methods?.length
  const { estimate } = usePincodeEstimate()

  const shippingLabel = hasShippingMethod
    ? convertToLocale({
        amount: cart.shipping_total ?? 0,
        currency_code: currency,
      })
    : estimate?.serviceable && typeof estimate.amount === "number"
    ? convertToLocale({
        amount: estimate.amount,
        currency_code: estimate.currency || currency,
      })
    : "TBD"

  const usingEstimate =
    !hasShippingMethod &&
    estimate?.serviceable === true &&
    typeof estimate.amount === "number"

  const projectedTotal = usingEstimate
    ? (cart.subtotal ?? 0) + (cart.tax_total ?? 0) + (estimate?.amount ?? 0)
    : cart.total ?? 0

  return (
    <aside className="h-fit border-2 border-ink bg-surface p-6 shadow-[8px_8px_0px_0px_var(--mc-ink)] lg:sticky lg:top-8">
      <h2 className="font-family-heading text-3xl font-black uppercase text-ink">
        Your Bag
      </h2>

      <ul className="mt-4 flex flex-col gap-4 border-t border-ink/20 pt-4">
        {cart.items?.map((item) => (
          <li key={item.id} className="flex gap-3">
            <div className="relative h-16 w-16 shrink-0 border border-ink/40">
              <Image
                src={item.thumbnail || "/monsoon/images/coffeebags.png"}
                alt={item.product_title ?? "Product"}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-1 flex-col">
              <p className="font-family-heading text-sm font-bold uppercase text-ink">
                {item.product_title}
              </p>
              <p className="font-family-heading text-xs font-medium uppercase tracking-widest text-ink/55">
                QTY {item.quantity}
              </p>
            </div>
            <p className="font-family-heading text-sm font-black text-ink">
              {convertToLocale({
                amount: (item.unit_price ?? 0) * item.quantity,
                currency_code: currency,
              })}
            </p>
          </li>
        ))}
      </ul>

      <dl className="mt-6 border-t border-ink/20 pt-4 font-family-heading text-sm uppercase">
        <div className="flex items-center justify-between py-1">
          <dt className="font-semibold text-ink/75">Subtotal</dt>
          <dd className="font-bold text-ink">
            {convertToLocale({
              amount: cart.subtotal ?? 0,
              currency_code: currency,
            })}
          </dd>
        </div>
        <div className="flex items-center justify-between py-1">
          <dt
            className={`font-semibold ${
              hasShippingMethod || usingEstimate
                ? "text-ink/75"
                : "text-ink/45"
            }`}
          >
            Shipping
            {hasShippingMethod && cart.shipping_methods?.[0]?.name && (
              <span className="ml-2 font-family-base text-[10px] font-normal normal-case tracking-normal text-ink/55">
                {cart.shipping_methods[0].name}
              </span>
            )}
            {usingEstimate && (
              <span className="ml-2 font-family-base text-[10px] font-normal normal-case tracking-normal text-ink/55">
                est.{estimate?.courier_name ? ` · ${estimate.courier_name}` : ""}
              </span>
            )}
          </dt>
          <dd
            className={`font-bold ${
              hasShippingMethod || usingEstimate ? "text-ink" : "text-ink/55"
            }`}
          >
            {shippingLabel}
          </dd>
        </div>
        <div className="flex items-center justify-between py-1">
          <dt className="font-semibold text-ink/45">Tax</dt>
          <dd className="font-bold text-ink/55">
            {convertToLocale({
              amount: cart.tax_total ?? 0,
              currency_code: currency,
            })}
          </dd>
        </div>
        <div className="mt-3 border-t border-ink/20 pt-3 flex items-end justify-between">
          <dt className="font-family-heading text-xs font-bold uppercase tracking-[0.18em] text-ink/70">
            Total
          </dt>
          <dd className="font-family-heading text-3xl font-black text-ink">
            {convertToLocale({
              amount: projectedTotal,
              currency_code: currency,
            })}
          </dd>
        </div>
        {usingEstimate && (
          <p className="mt-2 font-family-base text-[10px] uppercase tracking-widest text-ink/55">
            Total includes estimated shipping. Final price confirmed when you
            pick a method.
          </p>
        )}
      </dl>

      <LocalizedClientLink
        href="/cart"
        className="mt-6 inline-block font-family-heading text-xs font-bold uppercase tracking-[0.18em] underline underline-offset-4 text-ink/65 hover:text-ink"
      >
        ← Edit Bag
      </LocalizedClientLink>
    </aside>
  )
}

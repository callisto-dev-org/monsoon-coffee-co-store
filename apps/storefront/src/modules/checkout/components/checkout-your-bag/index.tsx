"use client"

import Image from "next/image"
import { HttpTypes } from "@medusajs/types"

import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type Props = {
  cart: HttpTypes.StoreCart
}

export default function CheckoutYourBag({ cart }: Props) {
  const currency = cart.currency_code
  // Shipping is included in the product price — no separate shipping line.
  const total = cart.total ?? 0

  return (
    <aside className="h-fit border-2 border-ink bg-surface p-6 shadow-[8px_8px_0px_0px_var(--mc-ink)] lg:sticky lg:top-8">
      <h2 className="font-family-heading text-3xl font-black uppercase text-ink">
        Your Cart
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
        <div className="mt-3 border-t border-ink/20 pt-3 flex items-end justify-between">
          <dt className="font-family-heading text-xs font-bold uppercase tracking-[0.18em] text-ink/70">
            Total
          </dt>
          <dd className="font-family-heading text-3xl font-black text-ink">
            {convertToLocale({
              amount: total,
              currency_code: currency,
            })}
          </dd>
        </div>
      </dl>

      <LocalizedClientLink
        href="/cart"
        className="mt-6 inline-block font-family-heading text-xs font-bold uppercase tracking-[0.18em] underline underline-offset-4 text-ink/65 hover:text-ink"
      >
        ← Edit Cart
      </LocalizedClientLink>
    </aside>
  )
}

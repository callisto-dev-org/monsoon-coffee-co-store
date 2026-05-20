"use client"

import { useParams, useRouter } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

import { convertToLocale } from "@lib/util/money"
import { CheckIcon } from "@modules/common/icons/monsoon/check"
import {
  CTAButton,
  OutlineButton,
} from "@modules/common/components/monsoon/buttons"

type Props = {
  cart: HttpTypes.StoreCart
}

export default function MonsoonCartSummary({ cart }: Props) {
  const router = useRouter()
  const { countryCode } = useParams() as { countryCode: string }
  const currency = cart.currency_code

  const subtotal = cart.subtotal ?? 0
  const tax = cart.tax_total ?? 0
  const shippingTotal = cart.shipping_total ?? 0
  const total = cart.total ?? 0

  return (
    <aside className="h-fit w-full self-start border-2 border-ink bg-surface p-6 shadow-[8px_8px_0px_0px_var(--mc-ink)] lg:sticky lg:top-8">
      <h2 className="font-family-heading text-3xl sm:text-4xl font-bold uppercase text-ink">
        Summary
      </h2>

      <div className="mt-4 border-t border-b border-ink/60 py-5 font-family-heading text-base sm:text-lg uppercase">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-ink/85">Subtotal</span>
          <span className="font-black text-ink">
            {convertToLocale({ amount: subtotal, currency_code: currency })}
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="font-semibold text-ink/45">Shipping</span>
          <span className="font-bold text-ink/55">
            {shippingTotal
              ? convertToLocale({
                  amount: shippingTotal,
                  currency_code: currency,
                })
              : "TBD"}
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="font-semibold text-ink/45">Estimated Tax</span>
          <span className="font-bold text-ink/55">
            {convertToLocale({ amount: tax, currency_code: currency })}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <p className="font-family-heading text-sm font-semibold uppercase tracking-[0.16em] text-ink/70">
          Total Due
        </p>
        <p className="mt-1 font-family-heading text-4xl sm:text-5xl font-black text-ink">
          {convertToLocale({ amount: total, currency_code: currency })}
        </p>
      </div>

      <CTAButton
        type="button"
        onClick={() => router.push(`/${countryCode}/checkout`)}
        className="mt-8 w-full bg-[var(--mc-primary)] py-4 font-family-heading text-xl font-bold transition-colors hover:bg-accent"
      >
        Proceed to Checkout
      </CTAButton>
      <OutlineButton
        type="button"
        onClick={() => router.push(`/${countryCode}/store`)}
        className="mt-4 w-full bg-surface py-3 font-family-heading text-sm font-bold uppercase tracking-[0.2em] text-ink"
      >
        Back to Shop
      </OutlineButton>

      <div className="mt-8 border-t border-ink/20 pt-6 text-ink/65">
        <p className="flex items-start gap-2 font-family-heading text-xs font-bold uppercase tracking-[0.14em]">
          <CheckIcon className="mt-0.5 h-4 w-4" />
          Secure transaction via industrial strength encryption.
        </p>
      </div>
    </aside>
  )
}

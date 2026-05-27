"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

import { convertToLocale } from "@lib/util/money"
import { CheckIcon } from "@modules/common/icons/monsoon/check"
import {
  CTAButton,
  OutlineButton,
} from "@modules/common/components/monsoon/buttons"
import MonsoonPincodeCheck, {
  PincodeEstimate,
} from "@modules/common/components/monsoon/pincode-check"

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
  const hasShippingMethod = !!cart.shipping_methods?.length

  const initialPincode =
    cart.shipping_address?.postal_code?.toString().replace(/\D/g, "") ?? ""

  const [estimate, setEstimate] = useState<PincodeEstimate | null>(null)

  // Prefer Medusa's authoritative shipping total when a method is selected.
  // Otherwise fall back to the Shipmozo estimate so the user sees a number
  // instead of "TBD".
  const shippingLabel = hasShippingMethod
    ? convertToLocale({ amount: shippingTotal, currency_code: currency })
    : estimate?.serviceable && typeof estimate.amount === "number"
    ? convertToLocale({
        amount: estimate.amount,
        currency_code: estimate.currency || currency,
      })
    : "TBD"

  // When no real shipping_total is in the cart yet, show the estimate in
  // the Total line too so the customer sees a realistic number.
  const projectedTotal =
    hasShippingMethod || !estimate?.serviceable || typeof estimate.amount !== "number"
      ? total
      : (cart.subtotal ?? 0) + (cart.tax_total ?? 0) + estimate.amount

  return (
    <aside className="h-fit w-full min-w-0 self-start border-2 border-ink bg-surface p-5 shadow-[4px_4px_0px_0px_var(--mc-ink)] sm:p-6 sm:shadow-[6px_6px_0px_0px_var(--mc-ink)] lg:sticky lg:top-8 lg:shadow-[8px_8px_0px_0px_var(--mc-ink)]">
      <h2 className="font-family-heading text-2xl font-bold uppercase text-ink sm:text-3xl lg:text-4xl">
        Summary
      </h2>

      <MonsoonPincodeCheck
        cartId={cart.id}
        currency={currency}
        className="mt-5"
        initialPincode={initialPincode || null}
        onEstimate={setEstimate}
      />

      <div className="mt-4 border-t border-b border-ink/60 py-5 font-family-heading text-sm uppercase sm:text-base lg:text-lg">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-ink/85">Subtotal</span>
          <span className="font-black text-ink">
            {convertToLocale({ amount: subtotal, currency_code: currency })}
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span
            className={`font-semibold ${
              hasShippingMethod || estimate?.serviceable
                ? "text-ink/85"
                : "text-ink/45"
            }`}
          >
            Shipping
            {!hasShippingMethod && estimate?.serviceable && (
              <span className="ml-2 font-family-base text-[10px] font-normal normal-case tracking-normal text-ink/55">
                est.{estimate.courier_name ? ` · ${estimate.courier_name}` : ""}
              </span>
            )}
          </span>
          <span
            className={`font-bold ${
              hasShippingMethod || estimate?.serviceable
                ? "text-ink"
                : "text-ink/55"
            }`}
          >
            {shippingLabel}
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
        <p className="font-family-heading text-xs font-semibold uppercase tracking-[0.16em] text-ink/70 sm:text-sm">
          Total Due
        </p>
        <p className="mt-1 font-family-heading text-3xl font-black tabular-nums text-ink sm:text-4xl lg:text-5xl">
          {convertToLocale({ amount: projectedTotal, currency_code: currency })}
        </p>
        {!hasShippingMethod && estimate?.serviceable && (
          <p className="mt-1 font-family-base text-xs text-ink/55">
            Includes estimated shipping. Confirmed at checkout.
          </p>
        )}
      </div>

      <CTAButton
        type="button"
        onClick={() => router.push(`/${countryCode}/checkout`)}
        className="mt-6 w-full bg-[var(--mc-primary)] py-3 font-family-heading text-base font-bold uppercase tracking-[0.14em] transition-colors hover:bg-accent sm:mt-8 sm:py-4 sm:text-lg sm:tracking-[0.16em] lg:text-xl"
      >
        Proceed to Checkout
      </CTAButton>
      <OutlineButton
        type="button"
        onClick={() => router.push(`/${countryCode}/store`)}
        className="mt-3 w-full bg-surface py-2.5 font-family-heading text-xs font-bold uppercase tracking-[0.18em] text-ink sm:mt-4 sm:py-3 sm:text-sm sm:tracking-[0.2em]"
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

"use client"

import { useState } from "react"
import { HttpTypes } from "@medusajs/types"

import RazorpayButton from "@modules/checkout/components/razorpay-button"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type Props = {
  cart: HttpTypes.StoreCart
  countryCode: string
  totalLabel: string
}

/**
 * Final checkout step: an explicit terms agreement the customer must tick
 * before paying. Razorpay is the only payment method, so this always renders
 * the Razorpay pay button.
 */
export default function PlaceOrder({ cart, countryCode, totalLabel }: Props) {
  const [agreed, setAgreed] = useState(false)

  const agreement = (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={agreed}
        onChange={(e) => setAgreed(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-ink"
      />
      <span className="font-family-base text-sm leading-relaxed text-ink/70">
        I have read and agree to Monsoon Coffee Co.&apos;s{" "}
        <LocalizedClientLink
          href="/terms-of-service"
          className="font-medium text-ink underline underline-offset-2 hover:text-accent"
        >
          Terms of Service
        </LocalizedClientLink>{" "}
        and{" "}
        <LocalizedClientLink
          href="/refund-policy"
          className="font-medium text-ink underline underline-offset-2 hover:text-accent"
        >
          Refund Policy
        </LocalizedClientLink>
        .
      </span>
    </label>
  )

  return (
    <div className="flex flex-col gap-4">
      <p className="font-family-base text-sm text-ink/65">
        You&apos;ll complete payment in Razorpay&apos;s secure checkout window.
      </p>
      {agreement}
      <RazorpayButton
        cart={cart}
        countryCode={countryCode}
        disabled={!agreed}
        className="w-full border-2 border-ink bg-ink px-4 py-3 font-family-heading text-sm font-bold uppercase tracking-[0.12em] text-surface hover:bg-surface hover:text-ink disabled:cursor-not-allowed disabled:opacity-60 sm:py-4 sm:text-base sm:tracking-[0.16em] lg:text-lg"
      >
        {`Pay with Razorpay — ${totalLabel}`}
      </RazorpayButton>
    </div>
  )
}

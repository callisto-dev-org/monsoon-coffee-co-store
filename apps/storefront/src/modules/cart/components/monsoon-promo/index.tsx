"use client"

import { useActionState } from "react"
import { submitPromotionForm } from "@lib/data/cart"

export default function MonsoonPromoCode() {
  const [message, formAction] = useActionState(submitPromotionForm, null)

  return (
    <section className="mt-10 max-w-md">
      <p className="font-family-heading text-sm font-bold uppercase tracking-[0.18em] text-ink/80">
        Have a promo code?
      </p>
      <form className="mt-4 flex h-12" action={formAction}>
        <input
          type="text"
          name="code"
          placeholder="ENTER CODE"
          className="w-full border border-ink border-r-0 bg-surface px-4 font-family-heading text-sm font-semibold tracking-[0.16em] text-ink outline-none placeholder:text-ink/35 focus:border-[var(--mc-primary)]"
        />
        <button
          type="submit"
          className="min-w-24 border border-ink bg-ink px-4 font-family-heading text-sm font-bold uppercase tracking-[0.16em] text-surface"
        >
          Apply
        </button>
      </form>
      {message && (
        <p className="mt-2 text-xs uppercase text-red-700">{message}</p>
      )}
    </section>
  )
}

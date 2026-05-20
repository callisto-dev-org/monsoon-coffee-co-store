"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

import { initPayment } from "@modules/checkout/actions"

type PaymentProvider = { id: string }

type Props = {
  providers: PaymentProvider[]
  cart: HttpTypes.StoreCart
}

const PROVIDER_LABELS: Record<string, string> = {
  pp_system_default: "Manual / Cash on Delivery",
  pp_stripe_stripe: "Stripe — Card",
  pp_stripe: "Stripe — Card",
}

function labelFor(id: string) {
  return (
    PROVIDER_LABELS[id] ??
    id
      .replace(/^pp_/, "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
  )
}

export default function MonsoonPaymentPicker({ providers, cart }: Props) {
  const router = useRouter()
  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )
  const [selected, setSelected] = useState<string | null>(
    activeSession?.provider_id ?? providers[0]?.id ?? null
  )
  const [isPending, startTransition] = useTransition()

  const submit = () => {
    if (!selected) return
    const fd = new FormData()
    fd.set("provider_id", selected)
    startTransition(async () => {
      await initPayment(fd)
      router.refresh()
    })
  }

  if (!providers.length) {
    return (
      <p className="font-family-base text-sm text-ink/65">
        No payment methods are configured for this region.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {providers.map((p) => {
          const isActive = selected === p.id
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setSelected(p.id)}
                className={`flex w-full items-center justify-between border-2 px-4 py-3 text-left font-family-heading text-sm font-bold uppercase tracking-[0.14em] transition-colors ${
                  isActive
                    ? "border-ink bg-ink text-surface"
                    : "border-ink/30 bg-surface text-ink hover:border-ink"
                }`}
              >
                <span>{labelFor(p.id)}</span>
                <span
                  className={`grid h-5 w-5 place-items-center border-2 ${
                    isActive ? "border-surface" : "border-ink"
                  }`}
                >
                  {isActive && (
                    <span className="block h-2 w-2 bg-surface" />
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <button
        type="button"
        onClick={submit}
        disabled={!selected || isPending}
        className="self-start border-2 border-ink bg-surface px-5 py-2 font-family-heading text-xs font-bold uppercase tracking-[0.18em] text-ink hover:bg-ink hover:text-surface disabled:opacity-50"
      >
        {isPending
          ? "Selecting…"
          : activeSession?.provider_id === selected
          ? "Method Selected ✓"
          : "Use This Method"}
      </button>
    </div>
  )
}

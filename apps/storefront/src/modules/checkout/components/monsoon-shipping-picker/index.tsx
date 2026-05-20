"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

import { selectShippingMethod } from "@modules/checkout/actions"
import { convertToLocale } from "@lib/util/money"

type Props = {
  cart: HttpTypes.StoreCart
  shippingOptions: HttpTypes.StoreCartShippingOption[]
}

export default function MonsoonShippingPicker({ cart, shippingOptions }: Props) {
  const router = useRouter()
  const currency = cart.currency_code

  const activeMethodId = useMemo(
    () => cart.shipping_methods?.[0]?.shipping_option_id ?? null,
    [cart.shipping_methods]
  )

  const [selected, setSelected] = useState<string | null>(
    activeMethodId ?? shippingOptions[0]?.id ?? null
  )
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!shippingOptions.length) {
    return (
      <p className="font-family-base text-sm text-ink/65">
        No shipping options are available for this address. Please confirm
        your shipping address or contact support.
      </p>
    )
  }

  const submit = () => {
    if (!selected) return
    setError(null)
    const fd = new FormData()
    fd.set("shipping_option_id", selected)
    startTransition(async () => {
      try {
        await selectShippingMethod(fd)
        router.refresh()
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Could not select shipping method."
        )
      }
    })
  }

  const formatPrice = (opt: HttpTypes.StoreCartShippingOption) => {
    const hasAmount = typeof opt.amount === "number"
    if (!hasAmount) {
      return opt.price_type === "calculated"
        ? "Calculated at checkout"
        : "—"
    }
    return convertToLocale({
      amount: opt.amount ?? 0,
      currency_code: currency,
    })
  }

  const typeLabel = (opt: HttpTypes.StoreCartShippingOption) =>
    opt.price_type === "calculated" ? "Live rate" : "Flat rate"

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {shippingOptions.map((opt) => {
          const isActive = selected === opt.id
          return (
            <li key={opt.id}>
              <button
                type="button"
                onClick={() => setSelected(opt.id)}
                aria-pressed={isActive}
                className={`flex w-full items-center justify-between gap-4 border-2 px-4 py-3 text-left font-family-heading text-sm font-bold uppercase tracking-[0.14em] transition-colors ${
                  isActive
                    ? "border-ink bg-ink text-surface"
                    : "border-ink/30 bg-surface text-ink hover:border-ink"
                }`}
              >
                <span className="flex flex-col gap-1">
                  <span className="flex items-center gap-2">
                    <span>{opt.name}</span>
                    <span
                      className={`border px-1.5 py-0.5 font-family-base text-[10px] font-bold uppercase tracking-[0.14em] ${
                        isActive
                          ? "border-surface/60 text-surface/80"
                          : "border-ink/40 text-ink/55"
                      }`}
                    >
                      {typeLabel(opt)}
                    </span>
                  </span>
                  <span
                    className={`font-family-base text-xs normal-case tracking-normal ${
                      isActive ? "text-surface/75" : "text-ink/60"
                    }`}
                  >
                    {formatPrice(opt)}
                  </span>
                </span>
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center border-2 ${
                    isActive ? "border-surface" : "border-ink"
                  }`}
                >
                  {isActive && <span className="block h-2 w-2 bg-surface" />}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {error && (
        <p className="border-2 border-red-700 bg-red-50 p-3 font-family-heading text-xs font-bold uppercase tracking-[0.14em] text-red-700">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={!selected || isPending}
        className="self-start border-2 border-ink bg-surface px-5 py-2 font-family-heading text-xs font-bold uppercase tracking-[0.18em] text-ink hover:bg-ink hover:text-surface disabled:opacity-50"
      >
        {isPending
          ? "Saving…"
          : activeMethodId === selected
          ? "Method Selected ✓"
          : "Use This Method"}
      </button>
    </div>
  )
}

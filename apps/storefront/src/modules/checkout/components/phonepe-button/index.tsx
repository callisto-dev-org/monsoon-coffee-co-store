"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import { HttpTypes } from "@medusajs/types"

import { placePhonePeOrder } from "@modules/checkout/actions"

type PhonePeSessionData = {
  id?: string
  merchant_order_id?: string
  phonepe_order_id?: string
  redirect_url?: string
  expire_at?: number
  amount?: number
  currency?: string
}

type PhonePeCheckout = {
  transact: (opts: {
    tokenUrl: string
    callback: (response: string) => void
    type: "IFRAME" | "REDIRECT"
  }) => void
  closePage?: () => void
}

declare global {
  interface Window {
    PhonePeCheckout?: PhonePeCheckout
  }
}

const PHONEPE_SDK_URL = "https://mercury.phonepe.com/web/bundle/checkout.js"

function loadPhonePeScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false)
  if (window.PhonePeCheckout) return Promise.resolve(true)
  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${PHONEPE_SDK_URL}"]`
    )
    if (existing) {
      existing.addEventListener("load", () => resolve(true))
      existing.addEventListener("error", () => resolve(false))
      return
    }
    const script = document.createElement("script")
    script.src = PHONEPE_SDK_URL
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

type Props = {
  cart: HttpTypes.StoreCart
  countryCode: string
  className?: string
  children?: React.ReactNode
  disabled?: boolean
}

export default function PhonePeButton({
  cart,
  countryCode,
  className,
  children,
  disabled,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  useEffect(() => {
    loadPhonePeScript()
  }, [])

  const session = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending" && s.provider_id.startsWith("pp_phonepe")
  )
  const data = (session?.data ?? {}) as PhonePeSessionData

  const handleClick = useCallback(async () => {
    setError(null)
    if (!session || !data.redirect_url || !data.merchant_order_id) {
      setError("Payment session not ready. Please reselect PhonePe.")
      return
    }

    setLoading(true)
    const ok = await loadPhonePeScript()
    if (!ok || !window.PhonePeCheckout) {
      setLoading(false)
      setError("Failed to load PhonePe checkout.")
      return
    }

    window.PhonePeCheckout.transact({
      tokenUrl: data.redirect_url,
      type: "IFRAME",
      callback: (response: string) => {
        // PhonePe returns one of: "USER_CANCEL", "CONCLUDED"
        if (response === "USER_CANCEL") {
          setLoading(false)
          setError("Payment cancelled. You can try again.")
          return
        }

        startTransition(async () => {
          try {
            await placePhonePeOrder({
              cartId: cart.id,
              countryCode,
            })
          } catch (e) {
            setLoading(false)
            setError(e instanceof Error ? e.message : "Could not place order")
          }
        })
      },
    })
  }, [cart.id, countryCode, data, session])

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading || !session}
        className={className}
      >
        {loading ? "Processing…" : children ?? "Pay with PhonePe"}
      </button>
      {error && (
        <p className="font-family-base text-sm text-red-700">{error}</p>
      )}
    </div>
  )
}

"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import { HttpTypes } from "@medusajs/types"

import { placeRazorpayOrder } from "@modules/checkout/actions"

type RazorpaySessionData = {
  id?: string
  razorpay_order_id?: string
  key_id?: string
  amount?: number
  currency?: string
}

type RazorpayResponse = {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

type RazorpayInstance = {
  open: () => void
  on: (event: string, handler: (response: unknown) => void) => void
}

type RazorpayOptions = {
  key: string
  order_id: string
  amount?: number
  currency?: string
  name: string
  description?: string
  prefill?: { name?: string; email?: string; contact?: string }
  theme?: { color?: string }
  handler: (response: RazorpayResponse) => void
  modal?: { ondismiss?: () => void }
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance
  }
}

const RAZORPAY_SDK_URL = "https://checkout.razorpay.com/v1/checkout.js"

function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false)
  if (window.Razorpay) return Promise.resolve(true)
  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${RAZORPAY_SDK_URL}"]`
    )
    if (existing) {
      existing.addEventListener("load", () => resolve(true))
      existing.addEventListener("error", () => resolve(false))
      return
    }
    const script = document.createElement("script")
    script.src = RAZORPAY_SDK_URL
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

export default function RazorpayButton({
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
    loadRazorpayScript()
  }, [])

  const session = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending" && s.provider_id.startsWith("pp_razorpay")
  )
  const data = (session?.data ?? {}) as RazorpaySessionData

  const handleClick = useCallback(async () => {
    setError(null)
    if (!session || !data.razorpay_order_id || !data.key_id) {
      setError("Payment session not ready. Please reselect Razorpay.")
      return
    }

    setLoading(true)
    const ok = await loadRazorpayScript()
    if (!ok || !window.Razorpay) {
      setLoading(false)
      setError("Failed to load Razorpay checkout.")
      return
    }

    const completeOrder = () => {
      startTransition(async () => {
        try {
          await placeRazorpayOrder({
            cartId: cart.id,
            countryCode,
          })
        } catch (e) {
          setLoading(false)
          setError(e instanceof Error ? e.message : "Could not place order")
        }
      })
    }

    const rzp = new window.Razorpay({
      key: data.key_id,
      order_id: data.razorpay_order_id,
      amount: data.amount,
      currency: data.currency,
      name: "Monsoon Coffee Co.",
      description: "Order payment",
      prefill: {
        name: [
          cart.shipping_address?.first_name,
          cart.shipping_address?.last_name,
        ]
          .filter(Boolean)
          .join(" "),
        email: cart.email ?? undefined,
        contact: cart.shipping_address?.phone ?? undefined,
      },
      theme: { color: "#1a1a1a" },
      handler: () => {
        // Razorpay has charged the order. The backend re-verifies the payment
        // status with Razorpay during cart completion before creating the order.
        completeOrder()
      },
      modal: {
        ondismiss: () => {
          setLoading(false)
          setError("Payment cancelled. You can try again.")
        },
      },
    })

    rzp.open()
  }, [cart, countryCode, data, session])

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading || !session}
        className={className}
      >
        {loading ? "Processing…" : children ?? "Pay with Razorpay"}
      </button>
      {error && (
        <p className="font-family-base text-sm text-red-700">{error}</p>
      )}
    </div>
  )
}

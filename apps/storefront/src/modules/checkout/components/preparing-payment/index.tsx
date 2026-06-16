"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { ensureRazorpaySession } from "@modules/checkout/actions"

type Props = {
  cartId: string
}

/**
 * Shown on the "Review & Place Order" step when the address is saved but no
 * pending payment session exists yet. Rather than asking the customer to
 * refresh manually, we create the Razorpay session ourselves and refresh the
 * route so the pay button appears. Capped at one auto-attempt per cart (tracked
 * in sessionStorage) so a session that genuinely can't be created can't spin
 * the page in a refresh loop.
 */
export default function PreparingPayment({ cartId }: Props) {
  const router = useRouter()
  const triggered = useRef(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (triggered.current) return
    triggered.current = true

    const key = `rzp-prep-${cartId}`
    if (typeof window !== "undefined" && window.sessionStorage.getItem(key)) {
      // Already auto-tried this cart and we're still here — stop and let the
      // customer retry manually instead of looping.
      setFailed(true)
      return
    }
    window.sessionStorage.setItem(key, "1")

    ;(async () => {
      try {
        await ensureRazorpaySession()
        router.refresh()
      } catch {
        setFailed(true)
      }
    })()
  }, [cartId, router])

  return (
    <p className="font-family-base text-sm text-ink/65">
      {failed
        ? "We couldn't prepare payment automatically. Please refresh the page to try again."
        : "Preparing secure payment…"}
    </p>
  )
}

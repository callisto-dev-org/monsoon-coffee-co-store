"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { ensureCheckoutReady } from "@modules/checkout/actions"

type Props = {
  cartId: string
}

const MAX_ATTEMPTS = 3
const RETRY_DELAY_MS = 700
// Hard cap on how many times we'll auto-refresh the route for one cart, across
// remounts, so a session that genuinely can't be created can't spin the page in
// a refresh loop.
const MAX_REFRESHES = 3

/**
 * Shown on the "Review & Place Order" step when the address is saved but no
 * pending payment session exists yet. Instead of asking the customer to refresh
 * manually, we run the full prepare sequence (shipping → Razorpay session) and
 * refresh once it reports ready — retrying a few times to ride out transient
 * backend hiccups, then falling back to a manual-refresh message.
 */
export default function PreparingPayment({ cartId }: Props) {
  const router = useRouter()
  const started = useRef(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    const key = `rzp-prep-${cartId}`
    const refreshes =
      typeof window !== "undefined"
        ? Number(window.sessionStorage.getItem(key) ?? "0")
        : MAX_REFRESHES
    if (refreshes >= MAX_REFRESHES) {
      setFailed(true)
      return
    }

    let cancelled = false

    const run = async () => {
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        let ready = false
        try {
          ;({ ready } = await ensureCheckoutReady())
        } catch {
          ready = false
        }
        if (cancelled) return
        if (ready) {
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem(key, String(refreshes + 1))
          }
          router.refresh()
          return
        }
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS))
        if (cancelled) return
      }
      setFailed(true)
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [cartId, router])

  return (
    <p className="font-family-base text-sm text-ink/65">
      {failed
        ? "We couldn't prepare payment automatically. Please refresh the page to try again."
        : "Preparing secure payment…"}
    </p>
  )
}

"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { sendGuestOtp, verifyGuestOtp } from "@lib/data/guest-otp"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  CTAButton,
  OutlineButton,
} from "@modules/common/components/monsoon/buttons"

type Props = {
  email: string | null
  loginHref: string
}

/**
 * Guest gate on the "Review & Place Order" step: a shopper without an account
 * must prove they own the email on the cart (via a 6-digit code) before they can
 * pay. They can also choose to sign in instead. Once verified, the server marks
 * the cart and re-renders the step with the pay button.
 */
export default function GuestEmailVerification({ email, loginHref }: Props) {
  const router = useRouter()
  const [sent, setSent] = useState(false)
  const [code, setCode] = useState("")
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const handleSend = () => {
    setError(null)
    setInfo(null)
    startTransition(async () => {
      const result = await sendGuestOtp()
      if (!result.ok) {
        setError(result.error ?? "Could not send the code.")
        return
      }
      setMaskedEmail(result.emailMasked ?? email)
      setSent(true)
      setInfo(`We sent a 6-digit code to ${result.emailMasked ?? email ?? "your email"}.`)
    })
  }

  const handleVerify = () => {
    setError(null)
    const trimmed = code.trim()
    if (!/^\d{6}$/.test(trimmed)) {
      setError("Enter the 6-digit code from your email.")
      return
    }
    startTransition(async () => {
      const result = await verifyGuestOtp(trimmed)
      if (!result.ok) {
        setError(result.error ?? "Could not verify the code.")
        return
      }
      // Cart is now marked verified server-side — re-render to reveal the
      // pay button.
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="font-family-heading text-[10px] font-bold uppercase tracking-[0.22em] text-accent sm:text-xs">
          Verify your email
        </p>
        <p className="mt-2 font-family-base text-sm text-ink/70">
          {sent
            ? "Enter the 6-digit code we emailed you to confirm it's you."
            : "Confirm the email on your order before paying. We'll send a one-time code to "}
          {!sent && (
            <span className="font-bold text-ink">{email ?? "your email"}</span>
          )}
          {!sent && "."}
        </p>
      </div>

      {!sent ? (
        <OutlineButton
          type="button"
          color="ink"
          onClick={handleSend}
          disabled={pending}
          className="w-full px-5 py-3 font-family-heading text-xs font-bold uppercase tracking-[0.16em] text-ink hover:bg-ink hover:text-surface disabled:opacity-50 sm:w-auto sm:self-start sm:px-6 sm:text-sm"
        >
          {pending ? "Sending…" : "Send verification code"}
        </OutlineButton>
      ) : (
        <div className="flex flex-col gap-4">
          <label className="grid gap-2">
            <span className="font-family-heading text-xs font-bold uppercase tracking-widest text-ink/70">
              Verification code
            </span>
            <input
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="••••••"
              className="h-12 w-full max-w-[12rem] border-2 border-ink bg-surface px-4 font-mono text-lg tracking-[0.4em] text-ink focus:outline-none"
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <CTAButton
              type="button"
              onClick={handleVerify}
              disabled={pending}
              className="px-6 py-3"
            >
              {pending ? "Verifying…" : "Verify & continue"}
            </CTAButton>
            <button
              type="button"
              onClick={handleSend}
              disabled={pending}
              className="font-family-heading text-[11px] font-bold uppercase tracking-[0.16em] text-ink/55 underline underline-offset-4 hover:text-ink disabled:opacity-50"
            >
              Resend code
            </button>
          </div>
        </div>
      )}

      {info && !error && (
        <p className="font-family-base text-sm text-ink/65">{info}</p>
      )}
      {error && (
        <p className="font-family-heading text-xs font-bold uppercase tracking-widest text-red-700">
          {error}
        </p>
      )}

      <div className="border-t border-ink/20 pt-4">
        <p className="font-family-base text-sm text-ink/65">
          Have an account?{" "}
          <LocalizedClientLink
            href={loginHref}
            className="font-medium text-ink underline underline-offset-2 hover:text-accent"
          >
            Log in instead
          </LocalizedClientLink>
          .
        </p>
      </div>
    </div>
  )
}

"use client"

import { useActionState, useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"

import { login } from "@lib/data/customer"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  CTAButton,
  OutlineButton,
} from "@modules/common/components/monsoon/buttons"

type Props = {
  setCurrentView?: (view: LOGIN_VIEW) => void
  registerHref?: string
  onUseOtp?: () => void
}

export default function MonsoonLogin({
  setCurrentView,
  registerHref,
  onUseOtp,
}: Props) {
  const router = useRouter()
  const { countryCode } = useParams() as { countryCode?: string }
  const searchParams = useSearchParams()
  const returnTo = searchParams?.get("returnTo")
  const [message, formAction, isPending] = useActionState(login, null)
  const [hasAttempted, setHasAttempted] = useState(false)

  useEffect(() => {
    if (isPending) setHasAttempted(true)
  }, [isPending])

  useEffect(() => {
    if (hasAttempted && !isPending && !message) {
      const fallback = countryCode ? `/${countryCode}/cart` : "/cart"
      router.push(returnTo || fallback)
      router.refresh()
    }
  }, [hasAttempted, isPending, message, returnTo, countryCode, router])

  return (
    <section
      className="w-full max-w-lg mx-auto border-2 border-ink bg-surface p-8 sm:p-12 shadow-[8px_8px_0px_0px_var(--mc-ink)]"
      data-testid="login-page"
    >
      <p className="font-family-heading text-xs font-bold uppercase tracking-[0.18em] text-accent">
        Member Access
      </p>
      <h1 className="mt-3 font-family-heading text-4xl sm:text-5xl font-black uppercase leading-[0.9] text-ink">
        Welcome <br /> Back
      </h1>
      <p className="mt-6 font-family-base text-base text-ink/70">
        Sign in to The Stash to track orders, favorites, and member-only drops.
      </p>

      <form className="mt-8 flex flex-col gap-5" action={formAction}>
        <label className="grid gap-2">
          <span className="font-family-heading text-xs font-bold uppercase tracking-widest text-ink/70">
            Email
          </span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            data-testid="email-input"
            className="h-12 border-2 border-ink bg-surface px-4 font-family-base text-ink focus:outline-none"
          />
        </label>
        <label className="grid gap-2">
          <span className="font-family-heading text-xs font-bold uppercase tracking-widest text-ink/70">
            Password
          </span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            data-testid="password-input"
            className="h-12 border-2 border-ink bg-surface px-4 font-family-base text-ink focus:outline-none"
          />
        </label>

        {message && (
          <p
            className="text-xs uppercase text-red-700 font-family-heading"
            data-testid="login-error-message"
          >
            {message}
          </p>
        )}

        <CTAButton
          type="submit"
          className="w-full py-3 mt-2"
          data-testid="sign-in-button"
        >
          Sign In
        </CTAButton>
      </form>

      {onUseOtp && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onUseOtp}
            className="font-family-heading text-xs font-bold uppercase tracking-[0.14em] text-ink/60 underline underline-offset-4 hover:text-ink"
            data-testid="use-otp-button"
          >
            Sign in with a login code instead
          </button>
        </div>
      )}

      <div className="mt-8 border-t border-ink/20 pt-6 flex items-center justify-between gap-4">
        <span className="font-family-base text-sm text-ink/65">
          Not a member yet?
        </span>
        {registerHref ? (
          <LocalizedClientLink href={registerHref}>
            <OutlineButton
              type="button"
              className="px-5 py-2 font-family-heading text-xs font-bold uppercase tracking-[0.12em] text-ink"
              data-testid="register-button"
            >
              Join The Stash
            </OutlineButton>
          </LocalizedClientLink>
        ) : (
          <OutlineButton
            type="button"
            onClick={() => setCurrentView?.(LOGIN_VIEW.REGISTER)}
            className="px-5 py-2 font-family-heading text-xs font-bold uppercase tracking-[0.12em] text-ink"
            data-testid="register-button"
          >
            Join The Stash
          </OutlineButton>
        )}
      </div>
    </section>
  )
}

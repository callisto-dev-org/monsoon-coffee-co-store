"use client"

import { useActionState, useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"

import { signup } from "@lib/data/customer"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  CTAButton,
  OutlineButton,
} from "@modules/common/components/monsoon/buttons"

type Props = {
  setCurrentView?: (view: LOGIN_VIEW) => void
  loginHref?: string
}

export default function MonsoonRegister({ setCurrentView, loginHref }: Props) {
  const router = useRouter()
  const { countryCode } = useParams() as { countryCode?: string }
  const searchParams = useSearchParams()
  const returnTo = searchParams?.get("returnTo")
  const [result, formAction, isPending] = useActionState(
    signup as (
      state: unknown,
      formData: FormData
    ) => Promise<unknown>,
    null
  )
  const errorMessage = typeof result === "string" ? result : null
  const succeeded = !!result && typeof result !== "string"
  const [hasAttempted, setHasAttempted] = useState(false)

  useEffect(() => {
    if (isPending) setHasAttempted(true)
  }, [isPending])

  useEffect(() => {
    if (hasAttempted && !isPending && succeeded) {
      const fallback = countryCode ? `/${countryCode}/cart` : "/cart"
      router.push(returnTo || fallback)
      router.refresh()
    }
  }, [hasAttempted, isPending, succeeded, returnTo, countryCode, router])

  return (
    <section
      className="w-full max-w-lg mx-auto border-2 border-ink bg-surface p-8 sm:p-12 shadow-[8px_8px_0px_0px_var(--mc-ink)]"
      data-testid="register-page"
    >
      <p className="font-family-heading text-xs font-bold uppercase tracking-[0.18em] text-accent">
        New Member
      </p>
      <h1 className="mt-3 font-family-heading text-4xl sm:text-5xl font-black uppercase leading-[0.9] text-ink">
        Join The <br /> Ledger
      </h1>
      <p className="mt-6 font-family-base text-base text-ink/70">
        Create an account to track orders, save favorites, and access
        member-only drops.
      </p>

      <form className="mt-8 flex flex-col gap-5" action={formAction}>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="font-family-heading text-xs font-bold uppercase tracking-widest text-ink/70">
              First Name
            </span>
            <input
              name="first_name"
              required
              autoComplete="given-name"
              data-testid="first-name-input"
              className="h-12 border-2 border-ink bg-surface px-4 font-family-base focus:outline-none"
            />
          </label>
          <label className="grid gap-2">
            <span className="font-family-heading text-xs font-bold uppercase tracking-widest text-ink/70">
              Last Name
            </span>
            <input
              name="last_name"
              required
              autoComplete="family-name"
              data-testid="last-name-input"
              className="h-12 border-2 border-ink bg-surface px-4 font-family-base focus:outline-none"
            />
          </label>
        </div>
        <label className="grid gap-2">
          <span className="font-family-heading text-xs font-bold uppercase tracking-widest text-ink/70">
            Email
          </span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            data-testid="email-input"
            className="h-12 border-2 border-ink bg-surface px-4 font-family-base focus:outline-none"
          />
        </label>
        <label className="grid gap-2">
          <span className="font-family-heading text-xs font-bold uppercase tracking-widest text-ink/70">
            Phone
          </span>
          <input
            name="phone"
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="tel"
            data-testid="phone-input"
            onInput={(e) => {
              const target = e.currentTarget
              target.value = target.value.replace(/\D/g, "")
            }}
            onKeyDown={(e) => {
              const allowed = [
                "Backspace",
                "Delete",
                "ArrowLeft",
                "ArrowRight",
                "Tab",
                "Home",
                "End",
              ]
              if (
                !/^[0-9]$/.test(e.key) &&
                !allowed.includes(e.key) &&
                !(e.ctrlKey || e.metaKey)
              ) {
                e.preventDefault()
              }
            }}
            className="h-12 border-2 border-ink bg-surface px-4 font-family-base focus:outline-none"
          />
        </label>
        <label className="grid gap-2">
          <span className="font-family-heading text-xs font-bold uppercase tracking-widest text-ink/70">
            Password
          </span>
          <input
            name="password"
            type="password"
            required
            autoComplete="new-password"
            data-testid="password-input"
            className="h-12 border-2 border-ink bg-surface px-4 font-family-base focus:outline-none"
          />
        </label>

        {errorMessage && (
          <p
            className="text-xs uppercase text-red-700 font-family-heading"
            data-testid="register-error"
          >
            {errorMessage}
          </p>
        )}

        <CTAButton
          type="submit"
          className="w-full py-3 mt-2"
          data-testid="register-submit-button"
        >
          Create Account
        </CTAButton>
      </form>

      <div className="mt-8 border-t border-ink/20 pt-6 flex items-center justify-between gap-4">
        <span className="font-family-base text-sm text-ink/65">
          Already a member?
        </span>
        {loginHref ? (
          <LocalizedClientLink href={loginHref}>
            <OutlineButton
              type="button"
              className="px-5 py-2 font-family-heading text-xs font-bold uppercase tracking-[0.12em] text-ink"
            >
              Sign In
            </OutlineButton>
          </LocalizedClientLink>
        ) : (
          <OutlineButton
            type="button"
            onClick={() => setCurrentView?.(LOGIN_VIEW.SIGN_IN)}
            className="px-5 py-2 font-family-heading text-xs font-bold uppercase tracking-[0.12em] text-ink"
          >
            Sign In
          </OutlineButton>
        )}
      </div>
    </section>
  )
}

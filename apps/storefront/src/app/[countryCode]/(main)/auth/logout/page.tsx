import { Metadata } from "next"

import { retrieveCustomer } from "@lib/data/customer"
import { signoutAction } from "@modules/account/actions"
import { CTAButton } from "@modules/common/components/monsoon/buttons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Sign Out",
  description: "Sign out of your Monsoon Coffee Co. account.",
}

export default async function LogoutPage(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const customer = await retrieveCustomer().catch(() => null)

  if (!customer) {
    return (
      <section className="w-full max-w-lg mx-auto border-2 border-ink bg-surface p-8 sm:p-12 shadow-[8px_8px_0px_0px_var(--mc-ink)]">
        <p className="font-family-heading text-xs font-bold uppercase tracking-[0.18em] text-accent">
          Session Closed
        </p>
        <h1 className="mt-3 font-family-heading text-4xl sm:text-5xl font-black uppercase leading-[0.9] text-ink">
          You&apos;re <br /> Signed Out
        </h1>
        <p className="mt-6 font-family-base text-base text-ink/70">
          Your stash is locked. Sign in again whenever you&apos;re ready.
        </p>
        <div className="mt-8 flex gap-4">
          <LocalizedClientLink href="/auth/login">
            <CTAButton className="px-6 py-3 text-sm font-bold uppercase tracking-[0.18em]">
              Sign In
            </CTAButton>
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/"
            className="font-family-heading text-sm font-bold uppercase tracking-[0.18em] underline underline-offset-4 self-center"
          >
            Back Home
          </LocalizedClientLink>
        </div>
      </section>
    )
  }

  return (
    <section className="w-full max-w-lg mx-auto border-2 border-ink bg-surface p-8 sm:p-12 shadow-[8px_8px_0px_0px_var(--mc-ink)]">
      <p className="font-family-heading text-xs font-bold uppercase tracking-[0.18em] text-accent">
        Sign Out
      </p>
      <h1 className="mt-3 font-family-heading text-4xl sm:text-5xl font-black uppercase leading-[0.9] text-ink">
        Close The <br /> Stash
      </h1>
      <p className="mt-6 font-family-base text-base text-ink/70">
        Sign out of {customer.email}. You can sign back in at any time.
      </p>

      <form action={signoutAction} className="mt-8 flex flex-col gap-4">
        <input type="hidden" name="countryCode" value={countryCode} />
        <CTAButton
          type="submit"
          className="w-full py-3 text-sm font-bold uppercase tracking-[0.18em]"
        >
          Sign Me Out
        </CTAButton>
      </form>

      <LocalizedClientLink
        href="/account"
        className="mt-6 inline-block font-family-heading text-xs font-bold uppercase tracking-[0.18em] underline underline-offset-4 text-ink/65 hover:text-ink"
      >
        Cancel — Back to Account
      </LocalizedClientLink>
    </section>
  )
}

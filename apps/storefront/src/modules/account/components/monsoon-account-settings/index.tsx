import { HttpTypes } from "@medusajs/types"

import AccountDetailsForm from "@modules/account/components/account-settings/account-details-form"
import SecurityForm from "@modules/account/components/account-settings/security-form"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type Props = {
  customer: HttpTypes.StoreCustomer
  hasPassword: boolean
}

const card = "relative border-2 border-ink bg-surface p-5 pt-8 sm:p-6 sm:pt-10"
const tab =
  "absolute left-5 top-0 -translate-y-1/2 border-2 border-ink bg-accent px-3 py-1.5 font-family-heading text-xs font-bold uppercase tracking-[0.12em] text-surface sm:left-6 sm:px-4 sm:py-2 sm:text-sm"

// Full-page settings surface for /account/profile. Shares the same forms as the
// dashboard modal.
export default function MonsoonAccountSettings({ customer, hasPassword }: Props) {
  return (
    <main className="w-full overflow-x-clip px-5 pb-20 pt-10 sm:px-8 sm:pt-14 lg:px-10 xl:px-12">
      <section className="border-b-2 border-ink pb-6">
        <p className="font-family-heading text-xs font-bold uppercase tracking-[0.22em] text-accent sm:text-sm">
          Member Account
        </p>
        <h1 className="mt-3 font-family-heading text-[clamp(2.25rem,8vw,5rem)] font-black uppercase leading-[0.9] tracking-[-0.02em] text-ink">
          Account Settings
        </h1>
        <LocalizedClientLink
          href="/account"
          className="mt-4 inline-flex font-family-heading text-[11px] font-bold uppercase tracking-[0.16em] text-ink/55 underline underline-offset-4 hover:text-ink"
        >
          ← Back to the Stash
        </LocalizedClientLink>
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section className={card}>
          <span className={tab}>Your Details</span>
          <AccountDetailsForm customer={customer} />
        </section>

        <section className={card}>
          <span className={tab}>Security</span>
          <SecurityForm hasPassword={hasPassword} />
        </section>
      </div>
    </main>
  )
}

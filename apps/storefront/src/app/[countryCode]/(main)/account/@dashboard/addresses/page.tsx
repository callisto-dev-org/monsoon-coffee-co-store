import { Metadata } from "next"
import { notFound } from "next/navigation"

import AddressBook from "@modules/account/components/address-book"

import { getRegion } from "@lib/data/regions"
import { retrieveCustomer } from "@lib/data/customer"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Addresses",
  description: "View your addresses",
}

export default async function Addresses(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params
  const { countryCode } = params
  const customer = await retrieveCustomer()
  const region = await getRegion(countryCode)

  if (!customer || !region) {
    notFound()
  }

  const total = customer.addresses?.length ?? 0
  const defaultShipping = customer.addresses?.find((a) => a.is_default_shipping)

  return (
    <main
      className="w-full px-6 pb-24 pt-14 sm:px-8 lg:px-10 xl:px-12"
      data-testid="addresses-page-wrapper"
    >
      <section className="border-b-2 border-ink pb-8 sm:pb-10">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <LocalizedClientLink
              href="/account"
              className="font-family-heading text-xs font-bold uppercase tracking-[0.16em] text-ink/45 hover:text-ink"
            >
              ← Back to account
            </LocalizedClientLink>
          </div>
          <p className="font-family-heading text-sm font-bold uppercase tracking-[0.12em] text-accent sm:text-base">
            Address Book
          </p>
          <h1 className="font-family-heading text-[clamp(2.5rem,6vw,5.5rem)] font-black uppercase leading-[0.9] text-ink">
            Shipping Addresses
          </h1>
          <p className="max-w-2xl font-family-base text-base text-ink/65 sm:text-lg">
            View and update your shipping addresses. Saved addresses are
            available during checkout — mark one as default to skip a step.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="border-2 border-ink bg-surface p-5">
            <p className="font-family-heading text-[11px] font-bold uppercase tracking-[0.2em] text-ink/45">
              Saved
            </p>
            <p className="mt-1 font-family-heading text-3xl font-black text-ink">
              {total}
            </p>
          </div>
          <div className="border-2 border-ink bg-surface p-5">
            <p className="font-family-heading text-[11px] font-bold uppercase tracking-[0.2em] text-ink/45">
              Default Shipping
            </p>
            <p className="mt-1 truncate font-family-heading text-base font-bold uppercase text-ink">
              {defaultShipping
                ? [defaultShipping.first_name, defaultShipping.address_1]
                    .filter(Boolean)
                    .join(" — ")
                : "Not set"}
            </p>
          </div>
          <div className="border-2 border-ink bg-ink p-5 text-surface">
            <p className="font-family-heading text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--mc-primary)]">
              Region
            </p>
            <p className="mt-1 truncate font-family-heading text-base font-bold uppercase">
              {region.name}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <AddressBook customer={customer} region={region} />
      </section>
    </main>
  )
}

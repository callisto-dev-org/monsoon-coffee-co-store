import { HttpTypes } from "@medusajs/types"
import { convertToLocale } from "@lib/util/money"
import { CTAButton } from "@modules/common/components/monsoon/buttons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import AddAddress from "@modules/account/components/address-card/add-address"
import OrderHistoryRow from "@modules/account/components/order-history-row"

type DashboardProps = {
  customer: HttpTypes.StoreCustomer
  orders: HttpTypes.StoreOrder[] | null
  countryCode: string
  region?: HttpTypes.StoreRegion | null
}

function MemberHero({ customer }: { customer: HttpTypes.StoreCustomer }) {
  const memberSince = customer.created_at
    ? new Date(customer.created_at).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : "—"
  const fullName =
    [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
    customer.email

  return (
    <section className="border-b-2 border-ink pb-8 sm:pb-10 lg:pb-12">
      <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-family-heading text-sm font-bold uppercase tracking-[0.12em] text-accent sm:text-base">
            Member Account
          </p>
          <h1 className="mt-4 font-family-heading text-[clamp(3rem,7vw,7rem)] font-black uppercase leading-[0.9] text-ink">
            THE ROASTER&apos;S <br /> LEDGER
          </h1>
        </div>
        <div className="text-left font-family-heading lg:text-right">
          <p className="text-xl sm:text-2xl font-bold uppercase leading-[1.05] text-[var(--mc-secondary)]">
            CURATED FOR: {fullName.toUpperCase()}
          </p>
          <p className="mt-2 text-sm font-medium uppercase tracking-[0.06em] text-ink/35 sm:text-base">
            MEMBER SINCE {memberSince.toUpperCase()}
          </p>
        </div>
      </div>
    </section>
  )
}

function ProfilePanel({
  customer,
  region,
}: {
  customer: HttpTypes.StoreCustomer
  region?: HttpTypes.StoreRegion | null
}) {
  const defaultShipping = customer.addresses?.find(
    (a) => a.is_default_shipping
  )
  const addressCount = customer.addresses?.length ?? 0
  const otherAddresses = (customer.addresses ?? []).filter(
    (a) => !a.is_default_shipping
  )

  const ctaBase =
    "inline-flex items-center justify-center border-2 border-ink px-5 py-3 font-family-heading text-sm font-bold uppercase tracking-[0.08em] transition-all"

  return (
    <section className="border-2 border-ink p-6 pt-10">
      <span className="inline-flex -translate-y-16 border-2 border-ink bg-accent px-4 py-2 font-family-heading text-sm font-bold uppercase tracking-[0.08em] text-surface">
        Profile
      </span>
      <div className="-mt-8 grid gap-6 xl:grid-cols-2">
        <article className="border-2 border-ink bg-surface p-6 shadow-[4px_4px_0px_0px_var(--mc-ink)]">
          <h3 className="font-family-heading text-2xl font-bold uppercase leading-tight text-ink">
            Account Email
          </h3>
          <p className="mt-3 font-family-base text-base text-ink/65 break-words">
            {customer.email}
          </p>
          <p className="mt-6 font-family-heading text-sm font-bold uppercase tracking-widest text-ink/45">
            Phone
          </p>
          <p className="font-family-base text-base text-ink/75">
            {customer.phone || "—"}
          </p>
        </article>
        <article className="flex flex-col border-2 border-ink bg-surface p-6 shadow-[4px_4px_0px_0px_var(--mc-ink)]">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-family-heading text-2xl font-bold uppercase leading-tight text-ink">
              Default Shipping
            </h3>
            {addressCount > 0 && (
              <span className="font-family-heading text-xs font-bold uppercase tracking-[0.12em] text-ink/45">
                {addressCount}{" "}
                {addressCount === 1 ? "address" : "addresses"} saved
              </span>
            )}
          </div>

          {defaultShipping ? (
            <div className="mt-3 text-base text-ink/75 font-family-base">
              <p>
                {[defaultShipping.first_name, defaultShipping.last_name]
                  .filter(Boolean)
                  .join(" ")}
              </p>
              {defaultShipping.address_1 && <p>{defaultShipping.address_1}</p>}
              {defaultShipping.address_2 && <p>{defaultShipping.address_2}</p>}
              <p>
                {[defaultShipping.city, defaultShipping.province, defaultShipping.postal_code]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              <p className="uppercase">{defaultShipping.country_code}</p>
            </div>
          ) : (
            <p className="mt-3 font-family-base text-base text-ink/55">
              No default shipping address yet.
            </p>
          )}

          {otherAddresses.length > 0 && (
            <details className="mt-4 border-2 border-ink/15">
              <summary className="cursor-pointer list-none px-3 py-2 font-family-heading text-xs font-bold uppercase tracking-[0.12em] text-ink/65 hover:text-ink">
                + {otherAddresses.length} other{" "}
                {otherAddresses.length === 1 ? "address" : "addresses"}
              </summary>
              <ul className="divide-y-2 divide-ink/10 border-t-2 border-ink/15">
                {otherAddresses.map((a) => (
                  <li
                    key={a.id}
                    className="px-3 py-3 font-family-base text-sm text-ink/75"
                  >
                    <p className="font-family-heading text-xs font-bold uppercase tracking-[0.08em] text-ink">
                      {[a.first_name, a.last_name].filter(Boolean).join(" ")}
                    </p>
                    <p className="mt-0.5">
                      {[a.address_1, a.city, a.postal_code]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </li>
                ))}
              </ul>
            </details>
          )}

          <div className="mt-auto flex flex-col gap-3 pt-5 sm:flex-row sm:flex-wrap">
            {region ? (
              <AddAddress
                region={region}
                addresses={customer.addresses ?? []}
                trigger={{
                  className: `${ctaBase} ${
                    defaultShipping
                      ? "bg-surface text-ink hover:bg-ink hover:text-surface"
                      : "bg-accent border-accent text-surface hover:bg-ink hover:border-ink"
                  }`,
                  "data-testid": defaultShipping
                    ? "add-another-address-button"
                    : "add-default-shipping-button",
                  children: defaultShipping
                    ? "+ Add another address"
                    : "Add default shipping address",
                }}
              />
            ) : (
              <LocalizedClientLink
                href="/account/addresses"
                className={`${ctaBase} ${
                  defaultShipping
                    ? "bg-surface text-ink hover:bg-ink hover:text-surface"
                    : "bg-accent border-accent text-surface hover:bg-ink hover:border-ink"
                }`}
              >
                {defaultShipping
                  ? "+ Add another address"
                  : "Add default shipping address"}
              </LocalizedClientLink>
            )}
            {addressCount > 0 && (
              <LocalizedClientLink
                href="/account/addresses"
                className={`${ctaBase} bg-surface text-ink hover:bg-ink hover:text-surface`}
              >
                Manage addresses
              </LocalizedClientLink>
            )}
          </div>
        </article>
      </div>
    </section>
  )
}

function OrderHistoryTable({
  orders,
  currencyCode,
}: {
  orders: HttpTypes.StoreOrder[] | null
  currencyCode: string
}) {
  return (
    <section className="mt-14">
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-family-heading text-4xl sm:text-5xl lg:text-6xl font-black uppercase text-ink">
          Order History
        </h2>
        <p className="font-family-heading text-sm font-medium uppercase tracking-[0.08em] text-ink/35 sm:text-base">
          Latest Orders
        </p>
      </div>

      <div className="mt-6 overflow-x-auto border border-ink/20">
        <table className="w-full min-w-[700px] border-collapse">
          <thead>
            <tr className="bg-ink text-surface">
              <th className="border-r border-surface/20 px-4 py-4 text-left font-family-heading text-base font-bold uppercase tracking-[0.1em]">
                Date
              </th>
              <th className="border-r border-surface/20 px-4 py-4 text-left font-family-heading text-base font-bold uppercase tracking-[0.1em]">
                Order
              </th>
              <th className="border-r border-surface/20 px-4 py-4 text-left font-family-heading text-base font-bold uppercase tracking-[0.1em]">
                Status
              </th>
              <th className="px-4 py-4 text-right font-family-heading text-base font-bold uppercase tracking-[0.1em]">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {orders && orders.length > 0 ? (
              orders.map((order) => (
                <OrderHistoryRow
                  key={order.id}
                  order={order}
                  currencyCode={currencyCode}
                />
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-12 text-center font-family-base text-ink/55"
                >
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function AccountActions(_props: { countryCode: string }) {
  return (
    <section className="mt-24 border-t-2 border-ink pt-10">
      <div className="flex justify-end">
        <LocalizedClientLink href="/auth/logout" className="md:w-auto w-full">
          <CTAButton
            type="button"
            className="w-full bg-ink px-8 py-4 font-family-heading text-xl font-bold uppercase md:w-auto"
          >
            Sign Out of Ledger
          </CTAButton>
        </LocalizedClientLink>
      </div>
    </section>
  )
}

export default function MonsoonDashboard({
  customer,
  orders,
  countryCode,
  region,
}: DashboardProps) {
  const currency = orders?.[0]?.currency_code ?? "usd"

  return (
    <main className="w-full px-6 pb-24 pt-14 sm:px-8 lg:px-10 xl:px-12">
      <MemberHero customer={customer} />
      <section className="mt-14">
        <ProfilePanel customer={customer} region={region} />
      </section>
      <OrderHistoryTable orders={orders} currencyCode={currency} />
      <AccountActions countryCode={countryCode} />
    </main>
  )
}

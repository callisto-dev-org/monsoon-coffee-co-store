import { HttpTypes } from "@medusajs/types"
import { convertToLocale } from "@lib/util/money"
import { CTAButton } from "@modules/common/components/monsoon/buttons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import AddAddress from "@modules/account/components/address-card/add-address"
import MonsoonAccountSettingsModal from "@modules/account/components/monsoon-account-settings-modal"

type DashboardProps = {
  customer: HttpTypes.StoreCustomer
  orders: HttpTypes.StoreOrder[] | null
  countryCode: string
  region?: HttpTypes.StoreRegion | null
  hasPassword: boolean
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
      <div className="flex flex-col gap-6 sm:gap-10 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-family-heading text-xs font-bold uppercase tracking-[0.22em] text-accent sm:text-sm lg:text-base">
            Member Account
          </p>
          <h1 className="mt-3 font-family-heading text-[clamp(2.5rem,9vw,7rem)] font-black uppercase leading-[0.88] tracking-[-0.02em] text-ink sm:mt-4">
            THE ROASTER&apos;S <br /> LEDGER
          </h1>
        </div>
        <div className="font-family-heading lg:text-right">
          <p className="break-words text-base font-bold uppercase leading-[1.1] text-[var(--mc-secondary)] sm:text-xl lg:text-2xl">
            CURATED FOR: {fullName.toUpperCase()}
          </p>
          <p className="mt-2 font-mono text-[11px] uppercase tabular-nums tracking-[0.08em] text-ink/45 sm:text-xs">
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
  hasPassword,
}: {
  customer: HttpTypes.StoreCustomer
  region?: HttpTypes.StoreRegion | null
  hasPassword: boolean
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
    <section className="relative border-2 border-ink p-5 pt-8 sm:p-6 sm:pt-10">
      <span className="absolute left-5 top-0 -translate-y-1/2 border-2 border-ink bg-accent px-3 py-1.5 font-family-heading text-xs font-bold uppercase tracking-[0.12em] text-surface sm:left-6 sm:px-4 sm:py-2 sm:text-sm">
        Profile
      </span>
      <div className="grid gap-5 sm:gap-6 xl:grid-cols-2">
        <article className="border-2 border-ink bg-surface p-5 shadow-[3px_3px_0px_0px_var(--mc-ink)] sm:p-6 sm:shadow-[4px_4px_0px_0px_var(--mc-ink)]">
          <h3 className="font-family-heading text-xl font-bold uppercase leading-tight text-ink sm:text-2xl">
            Account Email
          </h3>
          <p className="mt-3 break-words font-family-base text-sm text-ink/65 sm:text-base">
            {customer.email}
          </p>
          <p className="mt-5 font-family-base text-sm text-ink/55 sm:mt-6">
            Manage your name, password, and sign-in.
          </p>
          <div className="mt-4">
            <MonsoonAccountSettingsModal
              customer={customer}
              hasPassword={hasPassword}
            />
          </div>
        </article>
        <article className="flex flex-col border-2 border-ink bg-surface p-5 shadow-[3px_3px_0px_0px_var(--mc-ink)] sm:p-6 sm:shadow-[4px_4px_0px_0px_var(--mc-ink)]">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
            <h3 className="font-family-heading text-xl font-bold uppercase leading-tight text-ink sm:text-2xl">
              Default Shipping
            </h3>
            {addressCount > 0 && (
              <span className="font-family-heading text-[10px] font-bold uppercase tracking-[0.14em] text-ink/45 sm:text-xs sm:tracking-[0.12em]">
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
              {defaultShipping.phone && (
                <p className="mt-2 font-mono text-sm tabular-nums tracking-[0.04em] text-ink/55">
                  {defaultShipping.phone}
                </p>
              )}
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

const titleCaseStatus = (s: string) =>
  s
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((p) => p.slice(0, 1).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ")

const statusTone = (status: string) => {
  const s = status.toLowerCase()
  if (s.includes("deliver"))
    return "border-emerald-700 bg-emerald-50 text-emerald-800"
  if (s.includes("cancel")) return "border-red-700 bg-red-50 text-red-700"
  if (s.includes("ship") || s.includes("transit") || s.includes("pickup"))
    return "border-accent bg-[rgb(var(--mc-primary-rgb)/0.18)] text-accent"
  return "border-ink/40 bg-ink/5 text-ink/70"
}

function LatestBulletinRow({
  order,
}: {
  order: HttpTypes.StoreOrder
}) {
  const placedAt = new Date(order.created_at as string | Date)
  const displayStatus = titleCaseStatus(
    (order.fulfillment_status ?? order.status ?? "pending") as string
  )
  const itemCount =
    order.items?.reduce((acc, i) => acc + (i.quantity ?? 0), 0) ?? 0

  return (
    <LocalizedClientLink
      href={`/account/orders/details/${order.id}`}
      className="group flex flex-col gap-3 border-b-2 border-dashed border-ink/15 py-5 transition-colors first:pt-2 last:border-b-0 hover:bg-ink/[0.02] sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-2"
      data-testid="latest-bulletin-row"
    >
      <div className="flex min-w-0 items-baseline gap-3 sm:gap-5">
        <span className="font-family-heading text-[10px] font-bold uppercase tracking-[0.18em] text-ink/40">
          Ed.
        </span>
        <span
          className="font-family-heading text-xl font-black tabular-nums text-ink sm:text-2xl"
          data-testid="latest-order-id"
        >
          #{order.display_id}
        </span>
        <span className="font-mono text-[11px] uppercase tabular-nums tracking-[0.08em] text-ink/55 sm:text-xs">
          {placedAt.toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          })}
        </span>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        <span
          className={`inline-flex shrink-0 items-center border-2 px-2.5 py-1 font-family-heading text-[10px] font-bold uppercase tracking-[0.14em] sm:text-[11px] ${statusTone(
            displayStatus
          )}`}
        >
          {displayStatus}
        </span>
        <span className="hidden font-family-heading text-[11px] font-bold uppercase tracking-[0.14em] text-ink/55 md:inline">
          {itemCount} {itemCount === 1 ? "Item" : "Items"}
        </span>
        <span
          className="ml-auto font-family-heading text-base font-black tabular-nums text-ink sm:text-xl"
          data-testid="latest-order-amount"
        >
          {convertToLocale({
            amount: order.total ?? 0,
            currency_code: order.currency_code,
          })}
        </span>
        <span
          aria-hidden
          className="hidden translate-x-0 text-lg text-ink/35 transition-transform group-hover:translate-x-1 group-hover:text-accent sm:inline"
        >
          →
        </span>
      </div>
    </LocalizedClientLink>
  )
}

function LatestBulletins({
  orders,
}: {
  orders: HttpTypes.StoreOrder[] | null
}) {
  const latest = (orders ?? []).slice(0, 3)
  const total = orders?.length ?? 0

  return (
    <section className="mt-12 sm:mt-14">
      <div className="flex flex-col gap-3 border-b-2 border-ink pb-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div>
          <p className="font-family-heading text-[10px] font-bold uppercase tracking-[0.22em] text-accent sm:text-xs">
            Latest Bulletins
          </p>
          <h2 className="mt-2 font-family-heading text-3xl font-black uppercase leading-[0.95] text-ink sm:text-4xl lg:text-5xl">
            Recent Orders
          </h2>
        </div>
        {total > 0 && (
          <LocalizedClientLink
            href="/account/orders"
            className="group inline-flex items-center gap-2 self-start border-2 border-ink bg-surface px-4 py-2.5 font-family-heading text-[11px] font-bold uppercase tracking-[0.12em] text-ink transition-colors hover:bg-ink hover:text-surface sm:self-end"
            data-testid="view-all-orders"
          >
            <span>
              View All <span className="tabular-nums">({total})</span>
            </span>
            <span
              aria-hidden
              className="transition-transform group-hover:translate-x-0.5"
            >
              →
            </span>
          </LocalizedClientLink>
        )}
      </div>

      {latest.length > 0 ? (
        <div className="mt-2 flex flex-col">
          {latest.map((order) => (
            <LatestBulletinRow key={order.id} order={order} />
          ))}
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-start gap-4 border-2 border-dashed border-ink/30 bg-surface p-6 sm:p-8">
          <p className="font-family-heading text-lg font-bold uppercase text-ink sm:text-xl">
            Nothing brewing yet.
          </p>
          <p className="font-family-base text-sm text-ink/65 sm:text-base">
            Place your first order to see it logged here.
          </p>
          <LocalizedClientLink
            href="/store"
            className="inline-flex border-2 border-ink bg-ink px-5 py-3 font-family-heading text-xs font-bold uppercase tracking-[0.12em] text-surface hover:bg-accent hover:border-accent"
          >
            Explore the Ledger →
          </LocalizedClientLink>
        </div>
      )}

      {total > 3 && (
        <p className="mt-4 font-family-heading text-[11px] font-bold uppercase tracking-[0.14em] text-ink/45">
          + {total - 3} earlier {total - 3 === 1 ? "edition" : "editions"} in
          the archive
        </p>
      )}
    </section>
  )
}

function AccountActions(_props: { countryCode: string }) {
  return (
    <section className="mt-14 border-t-2 border-ink pt-8 sm:mt-20 sm:pt-10">
      <div className="flex justify-end">
        <LocalizedClientLink href="/auth/logout" className="w-full md:w-auto">
          <CTAButton
            type="button"
            className="w-full bg-ink px-6 py-3 font-family-heading text-base font-bold uppercase tracking-[0.12em] sm:px-8 sm:py-4 sm:text-lg lg:text-xl md:w-auto"
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
  hasPassword,
}: DashboardProps) {
  return (
    <main className="w-full overflow-x-clip px-5 pb-20 pt-10 sm:px-8 sm:pt-14 lg:px-10 xl:px-12">
      <MemberHero customer={customer} />
      <section className="mt-10 sm:mt-14">
        <ProfilePanel
          customer={customer}
          region={region}
          hasPassword={hasPassword}
        />
      </section>
      <LatestBulletins orders={orders} />
      <AccountActions countryCode={countryCode} />
    </main>
  )
}

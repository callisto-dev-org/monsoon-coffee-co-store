"use client"

import { useMemo } from "react"
import Image from "next/image"
import { HttpTypes } from "@medusajs/types"
import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { CTAButton } from "@modules/common/components/monsoon/buttons"

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

const titleCase = (s: string) =>
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

// Is this order still in motion (not delivered/cancelled)?
const isActive = (order: HttpTypes.StoreOrder) => {
  const s = ((order.fulfillment_status ?? order.status ?? "") as string).toLowerCase()
  return (
    !!s &&
    !s.includes("deliver") &&
    !s.includes("cancel")
  )
}

const monthDay = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "2-digit" })

const fullDate = (d: Date) =>
  d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  })

// ─────────────────────────────────────────────────────────────────────────
// Ledger entry
// ─────────────────────────────────────────────────────────────────────────

function Marker({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden
      className={`relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center border-2 ${
        active
          ? "border-accent bg-accent text-surface"
          : "border-ink bg-surface text-ink"
      }`}
    >
      {active && (
        <span className="absolute inset-0 animate-ping border-2 border-accent opacity-60" />
      )}
      <span className="font-family-heading text-[10px] font-black uppercase leading-none">
        ●
      </span>
    </span>
  )
}

function Thumbnails({ items }: { items: HttpTypes.StoreOrderLineItem[] }) {
  const visible = items.slice(0, 4)
  const overflow = items.length - visible.length

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {visible.map((i) => (
        <div
          key={i.id}
          className="relative h-10 w-10 shrink-0 overflow-hidden border-2 border-ink/15 bg-ink/[0.03] sm:h-12 sm:w-12"
          title={i.product_title ?? "Item"}
        >
          {i.thumbnail ? (
            <Image
              src={i.thumbnail}
              alt={i.product_title ?? "Item"}
              fill
              sizes="48px"
              className="object-cover"
            />
          ) : (
            <span className="absolute inset-0 grid place-items-center font-family-heading text-[10px] font-bold uppercase text-ink/35">
              {i.product_title?.slice(0, 1) ?? "·"}
            </span>
          )}
        </div>
      ))}
      {overflow > 0 && (
        <div className="grid h-10 w-10 shrink-0 place-items-center border-2 border-dashed border-ink/30 bg-ink/[0.02] font-family-heading text-[11px] font-bold tabular-nums text-ink/55 sm:h-12 sm:w-12">
          +{overflow}
        </div>
      )}
    </div>
  )
}

function LedgerEntry({
  order,
  isLast,
}: {
  order: HttpTypes.StoreOrder
  isLast: boolean
}) {
  const placedAt = new Date(order.created_at as string | Date)
  const itemCount = order.items?.reduce((s, i) => s + (i.quantity ?? 0), 0) ?? 0
  const status = titleCase(
    (order.fulfillment_status ?? order.status ?? "pending") as string
  )
  const active = isActive(order)

  return (
    <li
      className="relative grid grid-cols-[32px_minmax(0,1fr)] gap-4 pb-7 last:pb-2 sm:grid-cols-[32px_120px_minmax(0,1fr)] sm:gap-6"
      data-testid="ledger-entry"
    >
      {/* Vertical connector */}
      {!isLast && (
        <span
          aria-hidden
          className="absolute left-[15px] top-9 h-[calc(100%-1.5rem)] border-l-2 border-dashed border-ink/15"
        />
      )}

      <Marker active={active} />

      {/* Date stamp (desktop only column) */}
      <div className="hidden flex-col gap-1 pt-1 sm:flex">
        <span className="font-family-heading text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
          {placedAt.toLocaleDateString("en-US", { month: "short" })}
        </span>
        <span className="font-family-heading text-2xl font-black tabular-nums leading-[0.95] text-ink">
          {placedAt.toLocaleDateString("en-US", { day: "2-digit" })}
        </span>
        <span className="font-mono text-[10px] uppercase tabular-nums tracking-[0.08em] text-ink/45">
          {placedAt.toLocaleDateString("en-US", { weekday: "short" })}
        </span>
      </div>

      {/* Content card */}
      <article className="group relative border-2 border-ink bg-surface p-4 shadow-[3px_3px_0px_0px_var(--mc-ink)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_var(--mc-accent)] sm:p-5 sm:shadow-[4px_4px_0px_0px_var(--mc-ink)]">
        {/* Mobile date stamp (inline) */}
        <p className="mb-2 font-mono text-[11px] uppercase tabular-nums tracking-[0.1em] text-ink/55 sm:hidden">
          {fullDate(placedAt)}
        </p>

        {/* Title row */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <p className="font-family-heading text-[10px] font-bold uppercase tracking-[0.22em] text-accent">
              Edition · No.{" "}
              <span className="tabular-nums">{order.display_id}</span>
            </p>
            <h3 className="mt-1.5 font-family-heading text-2xl font-black uppercase leading-[0.95] text-ink sm:text-3xl">
              Roast #
              <span className="tabular-nums">{order.display_id}</span>
            </h3>
          </div>

          <span
            className={`inline-flex shrink-0 items-center self-start border-2 px-2.5 py-1 font-family-heading text-[10px] font-bold uppercase tracking-[0.14em] sm:text-[11px] ${statusTone(
              status
            )}`}
          >
            {status}
          </span>
        </header>

        {/* Body — thumbnails + total */}
        <div className="mt-4 flex flex-col gap-4 border-t-2 border-dashed border-ink/15 pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            {order.items && order.items.length > 0 && (
              <Thumbnails items={order.items} />
            )}
            <span className="font-family-heading text-[11px] font-bold uppercase tracking-[0.14em] text-ink/55 sm:text-xs">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
          </div>

          {/* Mobile: total left, CTA full-width below.
              Desktop: total + CTA inline on the right. */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            <div className="flex items-baseline justify-between gap-3 sm:flex-col sm:items-end sm:gap-0.5">
              <span className="font-family-heading text-[10px] font-bold uppercase tracking-[0.18em] text-ink/45">
                Total
              </span>
              <span
                className="font-family-heading text-xl font-black tabular-nums text-ink sm:text-2xl"
                data-testid="ledger-total"
              >
                {convertToLocale({
                  amount: order.total ?? 0,
                  currency_code: order.currency_code,
                })}
              </span>
            </div>

            <LocalizedClientLink
              href={`/account/orders/details/${order.id}`}
              className="inline-flex w-full items-center justify-center gap-2 border-2 border-ink bg-ink px-4 py-2.5 font-family-heading text-[11px] font-bold uppercase tracking-[0.12em] text-surface transition-colors group-hover:bg-accent group-hover:border-accent sm:w-auto sm:px-5 sm:py-3"
              data-testid="ledger-open-link"
            >
              <span>Open Bulletin</span>
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </LocalizedClientLink>
          </div>
        </div>

        {/* Whole-card link layer (mobile only — easier tap target) */}
        <LocalizedClientLink
          href={`/account/orders/details/${order.id}`}
          className="absolute inset-0 sm:hidden"
          aria-label={`Open order #${order.display_id}`}
        />
      </article>
    </li>
  )
}

function YearGroup({
  year,
  orders,
}: {
  year: number
  orders: HttpTypes.StoreOrder[]
}) {
  return (
    <section className="mb-8 last:mb-0">
      <div className="mb-5 flex items-center gap-4">
        <span className="font-family-heading text-2xl font-black tabular-nums text-ink sm:text-3xl">
          {year}
        </span>
        <span className="flex-1 border-t-2 border-dashed border-ink/15" />
        <span className="font-family-heading text-[10px] font-bold uppercase tracking-[0.18em] text-ink/45 sm:text-xs">
          <span className="tabular-nums">{orders.length}</span>{" "}
          {orders.length === 1 ? "Edition" : "Editions"}
        </span>
      </div>

      <ol>
        {orders.map((order, idx) => (
          <LedgerEntry
            key={order.id}
            order={order}
            isLast={idx === orders.length - 1}
          />
        ))}
      </ol>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────

const OrderOverview = ({ orders }: { orders: HttpTypes.StoreOrder[] }) => {
  const sortedOrders = useMemo(
    () =>
      [...(orders ?? [])].sort((a, b) => {
        const ad = new Date(a.created_at as string | Date).getTime()
        const bd = new Date(b.created_at as string | Date).getTime()
        return bd - ad
      }),
    [orders]
  )

  const grouped = useMemo(() => {
    const byYear = new Map<number, HttpTypes.StoreOrder[]>()
    for (const o of sortedOrders) {
      const y = new Date(o.created_at as string | Date).getFullYear()
      const bucket = byYear.get(y)
      if (bucket) bucket.push(o)
      else byYear.set(y, [o])
    }
    return Array.from(byYear.entries()).sort((a, b) => b[0] - a[0])
  }, [sortedOrders])

  if (!sortedOrders.length) {
    return (
      <div
        className="relative flex w-full flex-col items-start gap-5 border-2 border-dashed border-ink/30 bg-surface p-6 sm:items-center sm:p-12 sm:text-center"
        data-testid="no-orders-container"
      >
        <p className="font-family-heading text-[10px] font-bold uppercase tracking-[0.22em] text-accent sm:text-xs">
          The Stash
        </p>
        <h2 className="font-family-heading text-3xl font-black uppercase leading-[0.95] text-ink sm:text-5xl">
          Nothing brewing yet.
        </h2>
        <p className="max-w-md font-family-base text-sm text-ink/65 sm:text-base">
          Your archive is empty. Place your first order to start filling these
          pages with bulletins.
        </p>
        <LocalizedClientLink href="/store" passHref>
          <CTAButton
            type="button"
            className="px-6 py-3 font-family-heading text-sm font-bold uppercase tracking-[0.12em] sm:px-8 sm:py-4 sm:text-base"
            data-testid="continue-shopping-button"
          >
            Explore the Stash →
          </CTAButton>
        </LocalizedClientLink>
      </div>
    )
  }

  return (
    <div>
      {grouped.map(([year, list]) => (
        <YearGroup key={year} year={year} orders={list} />
      ))}
    </div>
  )
}

export default OrderOverview

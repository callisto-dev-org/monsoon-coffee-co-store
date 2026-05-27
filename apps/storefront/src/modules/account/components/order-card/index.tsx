import { useMemo } from "react"

import Thumbnail from "@modules/products/components/thumbnail"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type OrderCardProps = {
  order: HttpTypes.StoreOrder
}

const titleCaseStatus = (s: string) =>
  s
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((p) => p.slice(0, 1).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ")

const statusTone = (status: string) => {
  const s = status.toLowerCase()
  if (s.includes("deliver")) return "border-emerald-700 bg-emerald-50 text-emerald-800"
  if (s.includes("cancel")) return "border-red-700 bg-red-50 text-red-700"
  if (s.includes("ship") || s.includes("transit") || s.includes("pickup"))
    return "border-accent bg-[rgb(var(--mc-primary-rgb)/0.18)] text-accent"
  return "border-ink/40 bg-ink/5 text-ink/70"
}

const OrderCard = ({ order }: OrderCardProps) => {
  const lineCount = useMemo(
    () => order.items?.reduce((acc, i) => acc + (i.quantity ?? 0), 0) ?? 0,
    [order]
  )

  const displayStatus = titleCaseStatus(
    (order.fulfillment_status ?? order.status ?? "pending") as string
  )

  const placedAt = new Date(order.created_at as string | Date)

  return (
    <article
      className="group relative flex flex-col gap-5 border-2 border-ink bg-surface p-5 shadow-[4px_4px_0px_0px_var(--mc-ink)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_0px_var(--mc-accent)] sm:p-6"
      data-testid="order-card"
    >
      {/* ── Top row: edition + date / status ──────────────────────── */}
      <header className="flex items-start justify-between gap-4 border-b-2 border-dashed border-ink/15 pb-4">
        <div className="min-w-0">
          <p className="font-family-heading text-[10px] font-bold uppercase tracking-[0.22em] text-accent">
            Edition · No.{" "}
            <span className="tabular-nums" data-testid="order-display-id">
              {order.display_id}
            </span>
          </p>
          <h3 className="mt-2 font-family-heading text-2xl font-black uppercase leading-[0.95] text-ink sm:text-3xl">
            Roast #{order.display_id}
          </h3>
          <p className="mt-2 font-mono text-[11px] uppercase tabular-nums tracking-[0.08em] text-ink/55">
            <span data-testid="order-created-at">
              {placedAt.toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
              })}
            </span>
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center border-2 px-3 py-1 font-family-heading text-[10px] font-bold uppercase tracking-[0.14em] sm:text-[11px] ${statusTone(
            displayStatus
          )}`}
          data-testid="order-status"
        >
          {displayStatus}
        </span>
      </header>

      {/* ── Thumbnails strip ──────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {order.items?.slice(0, 4).map((i) => (
          <div
            key={i.id}
            className="relative h-14 w-14 shrink-0 border-2 border-ink/15 sm:h-16 sm:w-16"
            data-testid="order-item"
            title={i.title}
          >
            <Thumbnail thumbnail={i.thumbnail} images={[]} size="full" />
          </div>
        ))}
        {(order.items?.length ?? 0) > 4 && (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center border-2 border-dashed border-ink/30 bg-ink/[0.03] font-family-heading text-[11px] font-bold uppercase tabular-nums text-ink/55 sm:h-16 sm:w-16">
            +{(order.items?.length ?? 0) - 4}
          </div>
        )}
        <div className="ml-auto hidden text-right sm:block">
          <p className="font-family-heading text-[10px] font-bold uppercase tracking-[0.18em] text-ink/40">
            Total Paid
          </p>
          <p
            className="mt-1 font-family-heading text-2xl font-black tabular-nums text-ink"
            data-testid="order-amount"
          >
            {convertToLocale({
              amount: order.total ?? 0,
              currency_code: order.currency_code,
            })}
          </p>
        </div>
      </div>

      {/* ── Footer: total (mobile) + CTA ─────────────────────────── */}
      <footer className="flex items-end justify-between gap-4 border-t-2 border-dashed border-ink/15 pt-4 sm:hidden">
        <div>
          <p className="font-family-heading text-[10px] font-bold uppercase tracking-[0.18em] text-ink/40">
            Total Paid
          </p>
          <p
            className="font-family-heading text-2xl font-black tabular-nums text-ink"
            data-testid="order-amount-mobile"
          >
            {convertToLocale({
              amount: order.total ?? 0,
              currency_code: order.currency_code,
            })}
          </p>
        </div>
        <span className="font-family-heading text-[11px] font-bold uppercase tracking-[0.14em] text-ink/55">
          {lineCount} {lineCount === 1 ? "Item" : "Items"}
        </span>
      </footer>

      {/* ── See-details (desktop) ─────────────────────────────────── */}
      <div className="hidden items-center justify-between gap-4 border-t-2 border-dashed border-ink/15 pt-4 sm:flex">
        <span className="font-family-heading text-[11px] font-bold uppercase tracking-[0.14em] text-ink/55">
          {lineCount} {lineCount === 1 ? "Item" : "Items"} · Placed{" "}
          {placedAt.toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
          })}
        </span>
        <LocalizedClientLink href={`/account/orders/details/${order.id}`}>
          <span
            className="inline-flex items-center gap-2 border-2 border-ink bg-ink px-5 py-2.5 font-family-heading text-[11px] font-bold uppercase tracking-[0.12em] text-surface transition-colors group-hover:bg-accent group-hover:border-accent"
            data-testid="order-details-link"
          >
            Open Bulletin
            <span aria-hidden>→</span>
          </span>
        </LocalizedClientLink>
      </div>

      {/* ── Stretched link covering whole card on mobile ─────────── */}
      <LocalizedClientLink
        href={`/account/orders/details/${order.id}`}
        className="absolute inset-0 sm:hidden"
        aria-label={`Open order #${order.display_id}`}
        data-testid="order-details-link-mobile"
      />
    </article>
  )
}

export default OrderCard

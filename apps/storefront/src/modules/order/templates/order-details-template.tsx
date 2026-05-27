"use client"

import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OrderActions from "@modules/order/components/order-actions"
import OrderSummary from "@modules/order/components/order-summary"
import ShippingDetails from "@modules/order/components/shipping-details"
import Tracking from "@modules/order/components/tracking"
import React from "react"

type OrderDetailsTemplateProps = {
  order: HttpTypes.StoreOrder
}

const tile =
  "relative border-2 border-ink bg-surface shadow-[4px_4px_0px_0px_var(--mc-ink)]"
const tilePad = "p-6 sm:p-8"

const titleCase = (str: string) =>
  str
    .split("_")
    .map((p) => p.slice(0, 1).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ")

const OrderDetailsTemplate: React.FC<OrderDetailsTemplateProps> = ({
  order,
}) => {
  const placedAt = order.created_at
    ? new Date(order.created_at as string | Date)
    : null

  const canCancel =
    !order.canceled_at &&
    order.status === "pending" &&
    (!order.fulfillment_status || order.fulfillment_status === "not_fulfilled")
  const canRefund =
    !order.canceled_at && order.fulfillment_status === "delivered"
  const hasActions = canCancel || canRefund

  return (
    <main className="relative mx-auto w-full max-w-[1400px] px-5 pb-24 pt-10 sm:px-8 lg:px-12 lg:pt-14">
      {/* ── Masthead ─────────────────────────────────────────────── */}
      <header className="relative">
        <div className="flex items-center justify-between border-b-2 border-ink pb-3 font-family-heading text-[10px] font-bold uppercase tracking-[0.22em] text-ink/55">
          <span>Monsoon Coffee Co. · Daily Bulletin</span>
          <LocalizedClientLink
            href="/account/orders"
            className="group inline-flex items-center gap-2 text-ink hover:text-accent"
            data-testid="back-to-overview-button"
          >
            <span aria-hidden className="transition-transform group-hover:-translate-x-0.5">←</span>
            <span>All Orders</span>
          </LocalizedClientLink>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="font-family-heading text-xs font-bold uppercase tracking-[0.22em] text-accent">
              Edition · No. <span className="tabular-nums">{order.display_id}</span>
            </p>
            <h1 className="mt-3 font-family-heading text-[clamp(2.75rem,7vw,6rem)] font-black uppercase leading-[0.86] tracking-[-0.02em] text-ink">
              Your Order,
              <br />
              <span className="text-accent">Tracked.</span>
            </h1>
            <p className="mt-4 max-w-xl font-family-base text-sm text-ink/65 sm:text-base">
              A live log of your beans on their way to you — from our roastery
              ledger to your door.
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 border-2 border-ink bg-surface p-5 font-family-base text-[13px] shadow-[4px_4px_0px_0px_var(--mc-accent)] lg:min-w-[280px]">
            <Meta label="Placed">
              {placedAt
                ? placedAt.toLocaleDateString("en-US", {
                    month: "short",
                    day: "2-digit",
                    year: "numeric",
                  })
                : "—"}
            </Meta>
            <Meta label="Edition">
              <span className="font-mono tabular-nums">#{order.display_id}</span>
            </Meta>
            <Meta label="Status">
              <span className="font-family-heading text-xs font-bold uppercase tracking-[0.1em] text-accent">
                {titleCase(order.fulfillment_status ?? "pending")}
              </span>
            </Meta>
            <Meta label="Payment">
              <span className="font-family-heading text-xs font-bold uppercase tracking-[0.1em] text-ink">
                {titleCase(order.payment_status ?? "pending")}
              </span>
            </Meta>
          </dl>
        </div>
      </header>

      {/* ── Bento ────────────────────────────────────────────────── */}
      <div
        className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-stretch"
        data-testid="order-details-container"
      >
        {/* Tracking hero — full-width lead story */}
        <section
          className={`${tile} ${tilePad} overflow-hidden lg:col-span-3`}
          data-testid="tracking-tile"
        >
          <Tracking order={order} />
        </section>

        {/* Receipt + Deliver-To — side-by-side row */}
        <section className={`${tile} ${tilePad} flex flex-col lg:col-span-1`}>
          <OrderSummary order={order} />
        </section>
        <section className={`${tile} ${tilePad} flex flex-col lg:col-span-2`}>
          <ShippingDetails order={order} />
        </section>

        {/* Items — full width */}
        <section
          className={`${tile} ${tilePad} lg:col-span-3`}
          data-testid="items-tile"
        >
          <div className="mb-6 flex items-end justify-between border-b-2 border-dashed border-ink/15 pb-4">
            <div>
              <p className="font-family-heading text-xs font-bold uppercase tracking-[0.2em] text-accent">
                In the Crate
              </p>
              <h2 className="mt-2 font-family-heading text-2xl font-black uppercase text-ink sm:text-3xl">
                What you ordered
              </h2>
            </div>
            <span className="font-family-heading text-[11px] font-bold uppercase tracking-[0.14em] text-ink/45">
              <span className="font-mono tabular-nums">
                {order.items?.length ?? 0}
              </span>{" "}
              {order.items?.length === 1 ? "Item" : "Items"}
            </span>
          </div>
          <Items order={order} />
        </section>

        {/* Actions + Help row */}
        {hasActions && (
          <section className={`${tile} ${tilePad} lg:col-span-2`}>
            <h2 className="mb-4 font-family-heading text-xs font-bold uppercase tracking-[0.2em] text-accent">
              Manage Order
            </h2>
            <OrderActions order={order} />
          </section>
        )}

        <section
          className={`${tile} ${tilePad} ${hasActions ? "" : "lg:col-span-3"}`}
        >
          <Help />
        </section>
      </div>

      {/* ── Colophon ──────────────────────────────────────────────── */}
      <footer className="mt-10 border-t-2 border-ink pt-4 font-family-heading text-[10px] font-bold uppercase tracking-[0.22em] text-ink/45">
        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
          <span>End of Bulletin · Brewed with care</span>
          <span className="font-mono tabular-nums normal-case tracking-normal">
            Order ID · {order.id}
          </span>
        </div>
      </footer>
    </main>
  )
}

const Meta = ({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) => (
  <div className="flex flex-col gap-1">
    <dt className="font-family-heading text-[10px] font-bold uppercase tracking-[0.18em] text-ink/45">
      {label}
    </dt>
    <dd className="text-ink">{children}</dd>
  </div>
)

export default OrderDetailsTemplate

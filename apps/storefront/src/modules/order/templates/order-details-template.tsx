"use client"

import { XMark } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import type { OrderTrackingResponse } from "@lib/data/orders"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OrderActions from "@modules/order/components/order-actions"
import OrderDetails from "@modules/order/components/order-details"
import OrderSummary from "@modules/order/components/order-summary"
import ShippingDetails from "@modules/order/components/shipping-details"
import TrackingDetails from "@modules/order/components/tracking-details"
import React from "react"

type OrderDetailsTemplateProps = {
  order: HttpTypes.StoreOrder
  tracking?: OrderTrackingResponse | null
}

const OrderDetailsTemplate: React.FC<OrderDetailsTemplateProps> = ({
  order,
  tracking,
}) => {
  return (
    <main className="w-full px-6 pb-24 pt-14 sm:px-8 lg:px-10 xl:px-12">
      <section className="border-b-2 border-ink pb-8 sm:pb-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-family-heading text-sm font-bold uppercase tracking-[0.12em] text-accent sm:text-base">
              Order Receipt
            </p>
            <h1 className="mt-4 font-family-heading text-[clamp(2.5rem,6vw,5.5rem)] font-black uppercase leading-[0.9] text-ink">
              Order #{order.display_id}
            </h1>
          </div>
          <LocalizedClientLink
            href="/account/orders"
            className="inline-flex items-center gap-2 self-start border-2 border-ink bg-surface px-4 py-3 font-family-heading text-xs font-bold uppercase tracking-[0.08em] text-ink transition-all hover:bg-ink hover:text-surface lg:self-end"
            data-testid="back-to-overview-button"
          >
            <XMark /> Back to overview
          </LocalizedClientLink>
        </div>
      </section>

      <div
        className="mt-10 flex flex-col gap-8"
        data-testid="order-details-container"
      >
        <section className="border-2 border-ink bg-surface p-6 sm:p-8 shadow-[4px_4px_0px_0px_var(--mc-ink)]">
          <OrderDetails order={order} showStatus />
        </section>

        <section className="border-2 border-ink bg-surface p-6 sm:p-8 shadow-[4px_4px_0px_0px_var(--mc-ink)]">
          <h2 className="mb-6 font-family-heading text-2xl sm:text-3xl font-black uppercase text-ink">
            Items
          </h2>
          <Items order={order} />
        </section>

        <section className="border-2 border-ink bg-surface p-6 sm:p-8 shadow-[4px_4px_0px_0px_var(--mc-ink)]">
          <TrackingDetails tracking={tracking ?? null} />
        </section>

        <section className="border-2 border-ink bg-surface p-6 sm:p-8 shadow-[4px_4px_0px_0px_var(--mc-ink)]">
          <ShippingDetails order={order} />
        </section>

        <section className="border-2 border-ink bg-surface p-6 sm:p-8 shadow-[4px_4px_0px_0px_var(--mc-ink)]">
          <OrderSummary order={order} />
        </section>

        <OrderActions order={order} />

        <section className="border-2 border-ink bg-surface p-6 sm:p-8 shadow-[4px_4px_0px_0px_var(--mc-ink)]">
          <Help />
        </section>
      </div>
    </main>
  )
}

export default OrderDetailsTemplate

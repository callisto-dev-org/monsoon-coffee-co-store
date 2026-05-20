"use client"

import OrderCard from "../order-card"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { CTAButton } from "@modules/common/components/monsoon/buttons"
import { HttpTypes } from "@medusajs/types"

const OrderOverview = ({ orders }: { orders: HttpTypes.StoreOrder[] }) => {
  if (orders?.length) {
    return (
      <div className="flex flex-col gap-y-6 w-full">
        {orders.map((o) => (
          <OrderCard key={o.id} order={o} />
        ))}
      </div>
    )
  }

  return (
    <div
      className="flex w-full flex-col items-center gap-y-6 border-2 border-dashed border-ink/30 bg-surface px-6 py-16 text-center"
      data-testid="no-orders-container"
    >
      <h2 className="font-family-heading text-3xl sm:text-4xl font-black uppercase text-ink">
        Nothing brewing yet
      </h2>
      <p className="max-w-md font-family-base text-base text-ink/65">
        You don&apos;t have any orders yet. Let&apos;s change that.
      </p>
      <LocalizedClientLink href="/" passHref>
        <CTAButton
          type="button"
          className="px-8 py-4 font-family-heading text-base font-bold uppercase"
          data-testid="continue-shopping-button"
        >
          Continue shopping
        </CTAButton>
      </LocalizedClientLink>
    </div>
  )
}

export default OrderOverview

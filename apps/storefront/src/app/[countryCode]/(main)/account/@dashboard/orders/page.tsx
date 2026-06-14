import { Metadata } from "next"

import OrderOverview from "@modules/account/components/order-overview"
import { notFound } from "next/navigation"
import { listOrders } from "@lib/data/orders"
import TransferRequestForm from "@modules/account/components/transfer-request-form"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Orders",
  description: "Overview of your previous orders.",
}

export default async function Orders() {
  const orders = await listOrders()

  if (!orders) {
    notFound()
  }

  return (
    <main
      className="w-full overflow-x-clip px-5 pb-24 pt-10 sm:px-8 sm:pt-14 lg:px-10 xl:px-12"
      data-testid="orders-page-wrapper"
    >
      <header>
        <div className="flex items-center justify-between gap-3 border-b-2 border-ink pb-3 font-family-heading text-[10px] font-bold uppercase tracking-[0.22em] text-ink/55">
          <span className="truncate">
            Monsoon Coffee Co. · The Stash
          </span>
          <LocalizedClientLink
            href="/account"
            className="group inline-flex shrink-0 items-center gap-2 text-ink hover:text-accent"
          >
            <span
              aria-hidden
              className="transition-transform group-hover:-translate-x-0.5"
            >
              ←
            </span>
            <span>Account</span>
          </LocalizedClientLink>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:mt-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="font-family-heading text-[10px] font-bold uppercase tracking-[0.22em] text-accent sm:text-xs">
              Account · The Archive
            </p>
            <h1 className="mt-3 font-family-heading text-[clamp(2.5rem,9vw,5.5rem)] font-black uppercase leading-[0.88] tracking-[-0.02em] text-ink">
              Order
              <br />
              <span className="text-accent">Stash.</span>
            </h1>
            <p className="mt-4 max-w-xl font-family-base text-sm text-ink/65 sm:text-base">
              A chronological record of every bag we&apos;ve sent your way.
              Open any edition for live tracking, the receipt, and a list of
              what landed in the crate.
            </p>
          </div>
        </div>
      </header>

      <section className="mt-8 sm:mt-10">
        <OrderOverview orders={orders} />
      </section>

      <section className="mt-12 border-t-2 border-ink pt-8 sm:mt-16 sm:pt-10">
        <TransferRequestForm />
      </section>
    </main>
  )
}

import { Metadata } from "next"

import OrderOverview from "@modules/account/components/order-overview"
import { notFound } from "next/navigation"
import { listOrders } from "@lib/data/orders"
import TransferRequestForm from "@modules/account/components/transfer-request-form"

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
      className="w-full px-6 pb-24 pt-14 sm:px-8 lg:px-10 xl:px-12"
      data-testid="orders-page-wrapper"
    >
      <section className="border-b-2 border-ink pb-8 sm:pb-10">
        <p className="font-family-heading text-sm font-bold uppercase tracking-[0.12em] text-accent sm:text-base">
          Account
        </p>
        <h1 className="mt-4 font-family-heading text-[clamp(2.5rem,6vw,5.5rem)] font-black uppercase leading-[0.9] text-ink">
          Your Orders
        </h1>
        <p className="mt-4 max-w-2xl font-family-base text-base text-ink/65 sm:text-lg">
          View your previous orders and their status. You can also request
          returns or exchanges if needed.
        </p>
      </section>

      <section className="mt-10">
        <OrderOverview orders={orders} />
      </section>

      <section className="mt-16 border-t-2 border-ink pt-10">
        <TransferRequestForm />
      </section>
    </main>
  )
}

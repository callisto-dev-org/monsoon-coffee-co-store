import { Metadata } from "next"
import { notFound } from "next/navigation"

import MonsoonDashboard from "@modules/account/components/monsoon-dashboard"
import { retrieveCustomer } from "@lib/data/customer"
import { listOrders } from "@lib/data/orders"
import { getRegion } from "@lib/data/regions"

export const metadata: Metadata = {
  title: "Account",
  description: "Overview of your account activity.",
}

export default async function AccountOverview(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const customer = await retrieveCustomer().catch(() => null)
  const orders = (await listOrders().catch(() => null)) || null
  const region = await getRegion(countryCode).catch(() => null)

  if (!customer) {
    notFound()
  }

  return (
    <MonsoonDashboard
      customer={customer}
      orders={orders}
      countryCode={countryCode}
      region={region}
    />
  )
}

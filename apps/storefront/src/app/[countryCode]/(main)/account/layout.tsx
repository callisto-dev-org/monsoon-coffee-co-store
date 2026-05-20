import { redirect } from "next/navigation"

import { retrieveCustomer } from "@lib/data/customer"
import AccountLayout from "@modules/account/templates/account-layout"

export default async function AccountPageLayout(props: {
  dashboard?: React.ReactNode
  login?: React.ReactNode
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const customer = await retrieveCustomer().catch(() => null)

  if (!customer) {
    const returnTo = encodeURIComponent(`/${countryCode}/account`)
    redirect(`/${countryCode}/auth/login?returnTo=${returnTo}`)
  }

  return <AccountLayout customer={customer}>{props.dashboard}</AccountLayout>
}

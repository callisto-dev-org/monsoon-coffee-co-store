import { Metadata } from "next"
import { notFound } from "next/navigation"

import { retrieveCustomer } from "@lib/data/customer"
import { getAccountPasswordStatus } from "@lib/data/account-settings"
import MonsoonAccountSettings from "@modules/account/components/monsoon-account-settings"

export const metadata: Metadata = {
  title: "Account Settings — Monsoon Coffee Co.",
  description: "Update your details and password.",
}

export default async function Profile() {
  const customer = await retrieveCustomer()

  if (!customer) {
    notFound()
  }

  const hasPassword = await getAccountPasswordStatus()

  return <MonsoonAccountSettings customer={customer} hasPassword={hasPassword} />
}

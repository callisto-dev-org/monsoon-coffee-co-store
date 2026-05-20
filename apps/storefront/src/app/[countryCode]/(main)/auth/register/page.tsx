import { Metadata } from "next"
import { redirect } from "next/navigation"

import { retrieveCustomer } from "@lib/data/customer"
import MonsoonRegister from "@modules/account/components/monsoon-register"

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a Monsoon Coffee Co. account.",
}

export default async function RegisterPage(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const customer = await retrieveCustomer().catch(() => null)

  if (customer) {
    redirect(`/${countryCode}/account`)
  }

  return <MonsoonRegister loginHref="/auth/login" />
}

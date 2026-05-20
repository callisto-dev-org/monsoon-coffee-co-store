import { Metadata } from "next"
import { redirect } from "next/navigation"

import { retrieveCustomer } from "@lib/data/customer"
import MonsoonLogin from "@modules/account/components/monsoon-login"

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Monsoon Coffee Co. account.",
}

export default async function LoginPage(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const customer = await retrieveCustomer().catch(() => null)

  if (customer) {
    redirect(`/${countryCode}/account`)
  }

  return <MonsoonLogin registerHref="/auth/register" />
}

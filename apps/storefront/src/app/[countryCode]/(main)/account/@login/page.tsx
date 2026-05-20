import { redirect } from "next/navigation"

export default async function LegacyAccountLoginSlot(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  redirect(`/${countryCode}/auth/login`)
}

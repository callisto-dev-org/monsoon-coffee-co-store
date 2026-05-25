"use server"

import { signout } from "@lib/data/customer"

export async function signoutAction(formData: FormData) {
  const countryCode = (formData.get("countryCode") as string) || "in"
  await signout(countryCode)
}

"use server"

import { signout } from "@lib/data/customer"

export async function signoutAction(formData: FormData) {
  const countryCode = (formData.get("countryCode") as string) || "us"
  await signout(countryCode)
}

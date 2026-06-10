"use server"

import { revalidateTag } from "next/cache"

import { sdk } from "@lib/config"
import { getAuthHeaders, getCacheTag } from "./cookies"

export type SettingsResult = { ok: boolean; error?: string }

// Update editable profile fields. Email is intentionally not editable here — it
// is the identifier the auth credential is keyed on, so changing it would
// detach login.
export async function updateAccountProfile(input: {
  first_name?: string
  last_name?: string
  phone?: string
}): Promise<SettingsResult> {
  try {
    const headers = { ...(await getAuthHeaders()) }
    await sdk.store.customer.update(
      {
        first_name: input.first_name,
        last_name: input.last_name,
        phone: input.phone,
      },
      {},
      headers
    )
    const tag = await getCacheTag("customers")
    revalidateTag(tag)
    return { ok: true }
  } catch (e: any) {
    return {
      ok: false,
      error: e?.message || "Could not update your details. Please try again.",
    }
  }
}

// Email a verification code the customer must enter to set/change a password.
export async function sendPasswordOtp(): Promise<
  SettingsResult & { emailMasked?: string }
> {
  try {
    const res = await sdk.client.fetch<{ ok: boolean; email_masked?: string }>(
      "/store/customers/me/password-otp/send",
      { method: "POST", headers: { ...(await getAuthHeaders()) } }
    )
    return { ok: true, emailMasked: res?.email_masked }
  } catch (e: any) {
    return {
      ok: false,
      error: e?.message || "Could not send the code. Please try again.",
    }
  }
}

// Set or change the account password. Requires the emailed verification code.
// Works for passwordless guest/OTP accounts (creates the credential) and
// existing accounts (updates it).
export async function setAccountPassword(
  password: string,
  code: string
): Promise<SettingsResult> {
  try {
    await sdk.client.fetch("/store/customers/me/set-password", {
      method: "POST",
      headers: { ...(await getAuthHeaders()) },
      body: { password, code },
    })
    const tag = await getCacheTag("customers")
    revalidateTag(tag)
    return { ok: true }
  } catch (e: any) {
    return {
      ok: false,
      error: e?.message || "Could not set your password. Please try again.",
    }
  }
}

// Whether the account already has a password (for "Set" vs "Change" labelling).
export async function getAccountPasswordStatus(): Promise<boolean> {
  try {
    const res = await sdk.client.fetch<{ has_password: boolean }>(
      "/store/customers/me/password-status",
      { method: "GET", headers: { ...(await getAuthHeaders()) }, cache: "no-store" }
    )
    return !!res?.has_password
  } catch {
    return false
  }
}

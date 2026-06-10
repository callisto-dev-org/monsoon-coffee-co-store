"use server"

import { revalidateTag } from "next/cache"

import { sdk } from "@lib/config"
import { getCacheTag, setAuthToken } from "./cookies"
import { transferCart } from "./customer"

export type SendLoginOtpResult = {
  ok: boolean
  emailMasked?: string
  error?: string
}
export type VerifyLoginOtpResult = { ok: boolean; error?: string }

// Email a login code to an existing account. The publishable key is attached by
// the SDK config automatically.
export async function sendLoginOtp(email: string): Promise<SendLoginOtpResult> {
  const trimmed = (email ?? "").trim()
  if (!trimmed) return { ok: false, error: "Enter your email." }

  try {
    const res = await sdk.client.fetch<{ ok: boolean; email_masked?: string }>(
      "/store/auth-otp/send",
      { method: "POST", body: { email: trimmed } }
    )
    return { ok: true, emailMasked: res?.email_masked }
  } catch (e: any) {
    return {
      ok: false,
      error: e?.message || "Could not send the code. Please try again.",
    }
  }
}

// Verify a login code. On success the backend returns a customer session token,
// which we store exactly like the password login does — then the shopper is
// authenticated and their guest cart is transferred to the account.
export async function verifyLoginOtp(
  email: string,
  code: string
): Promise<VerifyLoginOtpResult> {
  const trimmed = (email ?? "").trim()

  try {
    const res = await sdk.client.fetch<{ token: string }>(
      "/store/auth-otp/verify",
      { method: "POST", body: { email: trimmed, code } }
    )
    if (!res?.token) {
      return { ok: false, error: "Could not sign you in. Please try again." }
    }

    await setAuthToken(res.token)
    const customerCacheTag = await getCacheTag("customers")
    revalidateTag(customerCacheTag)

    try {
      await transferCart()
    } catch {
      // Non-fatal: the shopper is signed in even if cart transfer hiccups.
    }

    return { ok: true }
  } catch (e: any) {
    return {
      ok: false,
      error: e?.message || "Could not verify the code. Please try again.",
    }
  }
}

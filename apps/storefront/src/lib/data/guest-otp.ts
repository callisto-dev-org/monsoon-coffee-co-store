"use server"

import { revalidateTag } from "next/cache"

import { sdk } from "@lib/config"
import { getAuthHeaders, getCacheTag, getCartId } from "./cookies"

export type SendOtpResult = { ok: boolean; emailMasked?: string; error?: string }
export type VerifyOtpResult = { ok: boolean; error?: string }

// Email the guest a verification code for the email already on their cart. The
// publishable key is attached by the SDK config automatically.
export async function sendGuestOtp(): Promise<SendOtpResult> {
  const cartId = await getCartId()
  if (!cartId) {
    return { ok: false, error: "Your bag has expired. Please add an item again." }
  }

  try {
    const res = await sdk.client.fetch<{ ok: boolean; email_masked?: string }>(
      "/store/guest-otp/send",
      {
        method: "POST",
        headers: { ...(await getAuthHeaders()) },
        body: { cart_id: cartId },
      }
    )
    return { ok: true, emailMasked: res?.email_masked }
  } catch (e: any) {
    return {
      ok: false,
      error: e?.message || "Could not send the code. Please try again.",
    }
  }
}

// Verify the guest's code. On success the cart is marked verified server-side;
// we bust the cart cache so the checkout re-renders with the pay button enabled.
export async function verifyGuestOtp(code: string): Promise<VerifyOtpResult> {
  const cartId = await getCartId()
  if (!cartId) {
    return { ok: false, error: "Your bag has expired. Please add an item again." }
  }

  try {
    await sdk.client.fetch("/store/guest-otp/verify", {
      method: "POST",
      headers: { ...(await getAuthHeaders()) },
      body: { cart_id: cartId, code },
    })
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
    return { ok: true }
  } catch (e: any) {
    return {
      ok: false,
      error: e?.message || "Could not verify the code. Please try again.",
    }
  }
}

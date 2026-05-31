"use server"

import { sdk } from "@lib/config"

export type ActionResult = { ok: boolean; error?: string }

// Submit the storefront "Contact Us" form. The publishable key is attached by
// the SDK config automatically, so this works as an unauthenticated store call.
export async function sendContactMessage(input: {
  name: string
  email: string
  subject?: string
  message: string
}): Promise<ActionResult> {
  try {
    await sdk.client.fetch("/store/contact", {
      method: "POST",
      body: {
        name: input.name,
        email: input.email,
        subject: input.subject || undefined,
        message: input.message,
      },
    })
    return { ok: true }
  } catch (e: any) {
    return {
      ok: false,
      error: e?.message || "Could not send your message. Please try again.",
    }
  }
}

// Idempotent newsletter signup.
export async function subscribeNewsletter(
  email: string
): Promise<ActionResult> {
  try {
    await sdk.client.fetch("/store/newsletter", {
      method: "POST",
      body: { email },
    })
    return { ok: true }
  } catch (e: any) {
    return {
      ok: false,
      error: e?.message || "Could not subscribe. Please try again.",
    }
  }
}

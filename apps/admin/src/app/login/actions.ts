"use server"

import { redirect } from "next/navigation"
import { setSession, clearSession } from "@/lib/session"

const BACKEND = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

export async function loginAction(_: unknown, formData: FormData) {
  const email = String(formData.get("email") || "")
  const password = String(formData.get("password") || "")

  if (!email || !password) {
    return { error: "Email and password are required." }
  }

  // Call Medusa's emailpass endpoint directly. The JS SDK's `auth.login`
  // defaults to localStorage for the token, which doesn't exist server-side
  // and surfaces as confusing "Unauthorized" errors here.
  let token: string | undefined
  try {
    const res = await fetch(`${BACKEND}/auth/user/emailpass`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    })

    if (!res.ok) {
      const body = await res.text()
      return {
        error:
          res.status === 401
            ? "Invalid email or password."
            : `Login failed (${res.status}): ${body || res.statusText}`,
      }
    }

    const json = (await res.json()) as { token?: string }
    token = json.token
  } catch (e: any) {
    return { error: e?.message || "Could not reach the Medusa backend." }
  }

  if (!token) {
    return { error: "Login did not return a token." }
  }

  await setSession(token)
  redirect("/inventory")
}

export async function logoutAction() {
  await clearSession()
  redirect("/login")
}

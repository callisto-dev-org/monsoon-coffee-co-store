import "server-only"
import { cookies } from "next/headers"

export const SESSION_COOKIE = "mc_admin_jwt"

export async function setSession(jwt: string) {
  const c = await cookies()
  c.set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8, // 8h
  })
}

export async function clearSession() {
  ;(await cookies()).delete(SESSION_COOKIE)
}

export async function hasSession() {
  return Boolean((await cookies()).get(SESSION_COOKIE)?.value)
}

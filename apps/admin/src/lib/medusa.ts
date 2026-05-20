import "server-only"
import Medusa from "@medusajs/js-sdk"
import { cookies } from "next/headers"
import { SESSION_COOKIE } from "./session"

const BACKEND = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

// Authed SDK for server-side use: reads the JWT from the cookie and attaches it.
// `jwtTokenStorageMethod: "memory"` is required server-side — the SDK's default
// is localStorage, which doesn't exist in Node and causes silent auth drops.
export async function adminSdk() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  const sdk = new Medusa({
    baseUrl: BACKEND,
    auth: { type: "jwt", jwtTokenStorageMethod: "memory" },
  })
  if (token) {
    await sdk.client.setToken(token)
  }
  return sdk
}

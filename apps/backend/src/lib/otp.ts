import crypto from "crypto"

// Shared one-time-password helpers used by both the guest-checkout email
// verification and the OTP login flow. State (hash, expiry, attempts) is stored
// on an existing entity's `metadata` (the cart for guest checkout, the customer
// for login) keyed/salted by a stable value — no dedicated table needed.

export const OTP_TTL_MS = 10 * 60 * 1000 // codes expire after 10 minutes
export const OTP_RESEND_COOLDOWN_MS = 30 * 1000 // min gap between sends
export const OTP_MAX_ATTEMPTS = 5 // wrong tries before a new code is required

export function normalizeEmail(email?: string | null): string {
  return (email ?? "").trim().toLowerCase()
}

export function generateOtpCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0")
}

// Salted SHA-256 so the plaintext code is never persisted. `salt` is a stable
// per-target value (cart id or email) that scopes the hash to that target.
export function hashOtp(code: string, salt: string): string {
  const secret = process.env.OTP_SECRET ?? "monsoon-otp"
  return crypto
    .createHash("sha256")
    .update(`${salt}:${code}:${secret}`)
    .digest("hex")
}

// "siddid@gmail.com" -> "si*****@gmail.com"
export function maskEmail(email: string): string {
  const [user, domain] = email.split("@")
  if (!domain) return email
  const head = user.slice(0, 2)
  return `${head}${"*".repeat(Math.max(1, user.length - head.length))}@${domain}`
}

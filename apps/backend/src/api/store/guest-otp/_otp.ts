// Guest-checkout OTP helpers. The generic crypto/format helpers live in the
// shared `lib/otp` module; this file adds the cart-specific verification check.
// A guest is "verified" when `guest_verified_email` matches the cart's current
// email (so changing the email re-arms the gate).

export {
  OTP_TTL_MS,
  OTP_RESEND_COOLDOWN_MS,
  OTP_MAX_ATTEMPTS,
  normalizeEmail,
  generateOtpCode,
  hashOtp,
  maskEmail,
} from "../../../lib/otp"

import { normalizeEmail } from "../../../lib/otp"

export type CartMetadata = Record<string, unknown>

export type CartLike = {
  email?: string | null
  metadata?: CartMetadata | null
}

export function isCartEmailVerified(cart: CartLike): boolean {
  const email = normalizeEmail(cart.email)
  if (!email) return false
  return cart.metadata?.guest_verified_email === email
}

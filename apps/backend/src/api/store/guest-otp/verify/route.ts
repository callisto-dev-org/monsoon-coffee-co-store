import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"

import type { VerifyOtpSchema } from "../middlewares"
import {
  OTP_MAX_ATTEMPTS,
  hashOtp,
  normalizeEmail,
  type CartMetadata,
} from "../_otp"

// Public store route. Checks a submitted code against the hash stored on the
// cart. On success it records `guest_verified_email` (matched against the cart's
// current email by the completion gate) and clears the OTP state. On failure it
// increments the attempt counter until the code must be re-requested.
export async function POST(
  req: MedusaRequest<VerifyOtpSchema>,
  res: MedusaResponse
) {
  const { cart_id, code } = req.validatedBody

  const cartModule = req.scope.resolve(Modules.CART)

  const cart = await cartModule
    .retrieveCart(cart_id, { select: ["id", "email", "metadata"] })
    .catch(() => null)
  if (!cart) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Cart not found.")
  }

  const email = normalizeEmail(cart.email)
  if (!email) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Add your email to the cart before verifying."
    )
  }

  const meta = (cart.metadata ?? {}) as CartMetadata
  const storedHash = meta.guest_otp_hash as string | undefined
  const storedEmail = meta.guest_otp_email as string | undefined
  const expires = Number(meta.guest_otp_expires ?? 0)
  const attempts = Number(meta.guest_otp_attempts ?? 0)

  if (!storedHash || !expires) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Request a verification code first."
    )
  }
  if (storedEmail !== email) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Your email changed — request a new code."
    )
  }
  if (Date.now() > expires) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "This code has expired. Request a new one."
    )
  }
  if (attempts >= OTP_MAX_ATTEMPTS) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Too many attempts. Request a new code."
    )
  }

  if (hashOtp(code, cart_id) !== storedHash) {
    await cartModule.updateCarts(cart_id, {
      metadata: { ...meta, guest_otp_attempts: attempts + 1 },
    })
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "That code is incorrect. Please try again."
    )
  }

  // Success: drop the OTP fields and stamp the verified email.
  const cleaned: CartMetadata = { ...meta }
  delete cleaned.guest_otp_hash
  delete cleaned.guest_otp_email
  delete cleaned.guest_otp_expires
  delete cleaned.guest_otp_last_sent
  delete cleaned.guest_otp_attempts

  await cartModule.updateCarts(cart_id, {
    metadata: { ...cleaned, guest_verified_email: email },
  })

  res.status(200).json({ ok: true })
}

import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"

import type { SendOtpSchema } from "../middlewares"
import {
  OTP_RESEND_COOLDOWN_MS,
  OTP_TTL_MS,
  generateOtpCode,
  hashOtp,
  maskEmail,
  normalizeEmail,
  type CartMetadata,
} from "../_otp"

// Public store route. Generates a one-time code for the email already on the
// cart, stores its hash on the cart metadata, and emails the code via the SMTP
// notification provider. The email is taken from the cart (not the request) so a
// caller can't request a code for an arbitrary address.
export async function POST(
  req: MedusaRequest<SendOtpSchema>,
  res: MedusaResponse
) {
  const { cart_id } = req.validatedBody

  const cartModule = req.scope.resolve(Modules.CART)
  const notificationService = req.scope.resolve(Modules.NOTIFICATION)

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
      "Add your email to the cart before requesting a code."
    )
  }

  const meta = (cart.metadata ?? {}) as CartMetadata
  const now = Date.now()
  const lastSent = Number(meta.guest_otp_last_sent ?? 0)
  if (lastSent && now - lastSent < OTP_RESEND_COOLDOWN_MS) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Please wait a moment before requesting another code."
    )
  }

  const code = generateOtpCode()
  await cartModule.updateCarts(cart_id, {
    metadata: {
      ...meta,
      guest_otp_hash: hashOtp(code, cart_id),
      guest_otp_email: email,
      guest_otp_expires: now + OTP_TTL_MS,
      guest_otp_last_sent: now,
      guest_otp_attempts: 0,
    },
  })

  await notificationService.createNotifications({
    to: email,
    channel: "email",
    template: "guest-otp",
    data: {
      code,
      subject: `Your Monsoon Coffee verification code: ${code}`,
    },
  })

  res.status(200).json({ ok: true, email_masked: maskEmail(email) })
}

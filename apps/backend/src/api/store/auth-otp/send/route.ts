import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"

import type { SendLoginOtpSchema } from "../middlewares"
import {
  OTP_RESEND_COOLDOWN_MS,
  OTP_TTL_MS,
  generateOtpCode,
  hashOtp,
  maskEmail,
  normalizeEmail,
} from "../../../../lib/otp"
import { findCustomerByEmail } from "../_account"

// Public store route. Emails a one-time login code to an EXISTING customer —
// either a registered account or a guest customer created at checkout. Only a
// truly unknown email is turned away. The code's hash is stored on the
// customer's metadata, salted by the email.
export async function POST(
  req: MedusaRequest<SendLoginOtpSchema>,
  res: MedusaResponse
) {
  const email = normalizeEmail(req.validatedBody.email)

  const customer = await findCustomerByEmail(req.scope, email)
  if (!customer) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "No account found for this email. Please register first."
    )
  }

  const meta = (customer.metadata ?? {}) as Record<string, unknown>
  const now = Date.now()
  const lastSent = Number(meta.login_otp_last_sent ?? 0)
  if (lastSent && now - lastSent < OTP_RESEND_COOLDOWN_MS) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Please wait a moment before requesting another code."
    )
  }

  const code = generateOtpCode()
  const customerModule = req.scope.resolve(Modules.CUSTOMER)
  await customerModule.updateCustomers(customer.id, {
    metadata: {
      ...meta,
      login_otp_hash: hashOtp(code, email),
      login_otp_expires: now + OTP_TTL_MS,
      login_otp_last_sent: now,
      login_otp_attempts: 0,
    },
  })

  const notificationService = req.scope.resolve(Modules.NOTIFICATION)
  await notificationService.createNotifications({
    to: email,
    channel: "email",
    template: "login-otp",
    data: {
      code,
      subject: `Your Monsoon Coffee login code: ${code}`,
    },
  })

  res.status(200).json({ ok: true, email_masked: maskEmail(email) })
}

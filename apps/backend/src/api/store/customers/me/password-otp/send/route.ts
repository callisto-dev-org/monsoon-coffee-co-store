import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"

import {
  OTP_RESEND_COOLDOWN_MS,
  OTP_TTL_MS,
  generateOtpCode,
  hashOtp,
  maskEmail,
} from "../../../../../../lib/otp"

// Emails a verification code the customer must enter to set/change their
// password. Code hash is stored on the customer's metadata (separate namespace
// from the login OTP). Auto-protected under `/store/customers/me/*`.
export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const customerId = req.auth_context.actor_id

  const customerModule = req.scope.resolve(Modules.CUSTOMER)
  const customer = await customerModule
    .retrieveCustomer(customerId, { select: ["id", "email", "metadata"] })
    .catch(() => null)
  if (!customer?.email) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Account not found.")
  }
  const email = customer.email.trim().toLowerCase()

  const meta = (customer.metadata ?? {}) as Record<string, unknown>
  const now = Date.now()
  const lastSent = Number(meta.pw_otp_last_sent ?? 0)
  if (lastSent && now - lastSent < OTP_RESEND_COOLDOWN_MS) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Please wait a moment before requesting another code."
    )
  }

  const code = generateOtpCode()
  await customerModule.updateCustomers(customerId, {
    metadata: {
      ...meta,
      pw_otp_hash: hashOtp(code, email),
      pw_otp_expires: now + OTP_TTL_MS,
      pw_otp_last_sent: now,
      pw_otp_attempts: 0,
    },
  })

  const notificationService = req.scope.resolve(Modules.NOTIFICATION)
  await notificationService.createNotifications({
    to: email,
    channel: "email",
    template: "password-otp",
    data: {
      code,
      subject: `Your Monsoon Coffee password code: ${code}`,
    },
  })

  res.status(200).json({ ok: true, email_masked: maskEmail(email) })
}

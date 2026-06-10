import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"

import type { SetPasswordSchema } from "../middlewares"
import { OTP_MAX_ATTEMPTS, hashOtp } from "../../../../../lib/otp"

// Set or change the authenticated customer's password. Works for accounts that
// already have a password (updates it) AND for passwordless customers — guests
// created at checkout or OTP-login users with no emailpass credential — by
// creating the credential and linking it to the customer. The route is under
// the auto-protected `/store/customers/me/*` prefix.
export async function POST(
  req: AuthenticatedMedusaRequest<SetPasswordSchema>,
  res: MedusaResponse
) {
  const customerId = req.auth_context.actor_id
  const { password, code } = req.validatedBody

  const customerModule = req.scope.resolve(Modules.CUSTOMER)
  const customer = await customerModule
    .retrieveCustomer(customerId, {
      select: ["id", "email", "has_account", "metadata"],
    })
    .catch(() => null)
  if (!customer?.email) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Account not found.")
  }
  const email = customer.email.trim().toLowerCase()

  // Verify the emailed code before changing the password.
  const meta = (customer.metadata ?? {}) as Record<string, unknown>
  const storedHash = meta.pw_otp_hash as string | undefined
  const expires = Number(meta.pw_otp_expires ?? 0)
  const attempts = Number(meta.pw_otp_attempts ?? 0)
  if (!storedHash || !expires) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Request a verification code first."
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
  if (hashOtp(code, email) !== storedHash) {
    await customerModule.updateCustomers(customerId, {
      metadata: { ...meta, pw_otp_attempts: attempts + 1 },
    })
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "That code is incorrect. Please try again."
    )
  }

  // Code is valid — clear the OTP state before proceeding.
  const clearedMeta: Record<string, unknown> = { ...meta }
  delete clearedMeta.pw_otp_hash
  delete clearedMeta.pw_otp_expires
  delete clearedMeta.pw_otp_last_sent
  delete clearedMeta.pw_otp_attempts
  await customerModule.updateCustomers(customerId, { metadata: clearedMeta })

  // Does an emailpass credential already exist for this email?
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: providerIdentities } = await query.graph({
    entity: "provider_identity",
    fields: ["auth_identity_id"],
    filters: { entity_id: email, provider: "emailpass" },
  })
  const existingAuthIdentityId =
    (providerIdentities?.[0]?.auth_identity_id as string | undefined) ?? null

  const authService = req.scope.resolve(Modules.AUTH)

  if (existingAuthIdentityId) {
    // Update the existing password.
    const { success, error } = await authService.updateProvider("emailpass", {
      entity_id: email,
      password,
    })
    if (!success) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        error || "Could not update your password."
      )
    }
  } else {
    // Create the credential for a passwordless customer, then link it to them
    // so a future password login resolves to this customer.
    const { success, authIdentity, error } = await authService.register(
      "emailpass",
      { body: { email, password } }
    )
    if (!success || !authIdentity) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        error || "Could not set your password."
      )
    }

    await authService.updateAuthIdentities({
      id: authIdentity.id,
      app_metadata: {
        ...(authIdentity.app_metadata ?? {}),
        customer_id: customerId,
      },
    })

    // Promote a guest to a registered account now that it has a password.
    if (!customer.has_account) {
      try {
        await customerModule.updateCustomers(customerId, {
          has_account: true,
        } as Record<string, unknown>)
      } catch {
        // Best-effort: the password is set regardless of this flag.
      }
    }
  }

  res.status(200).json({ ok: true })
}

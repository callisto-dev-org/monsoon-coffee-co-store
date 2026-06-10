import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
  generateJwtToken,
} from "@medusajs/framework/utils"

import type { VerifyLoginOtpSchema } from "../middlewares"
import { OTP_MAX_ATTEMPTS, hashOtp, normalizeEmail } from "../../../../lib/otp"
import { findCustomerByEmail, findEmailpassAuthIdentityId } from "../_account"

// Public store route. Verifies a login code and, on success, mints a customer
// session JWT — the same token shape the core `/auth/customer/emailpass` login
// returns — so the storefront can store it and the shopper is authenticated.
export async function POST(
  req: MedusaRequest<VerifyLoginOtpSchema>,
  res: MedusaResponse
) {
  const email = normalizeEmail(req.validatedBody.email)
  const { code } = req.validatedBody

  const customer = await findCustomerByEmail(req.scope, email)
  if (!customer) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "No account found for this email. Please register first."
    )
  }

  const meta = (customer.metadata ?? {}) as Record<string, unknown>
  const storedHash = meta.login_otp_hash as string | undefined
  const expires = Number(meta.login_otp_expires ?? 0)
  const attempts = Number(meta.login_otp_attempts ?? 0)

  if (!storedHash || !expires) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Request a login code first."
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

  const customerModule = req.scope.resolve(Modules.CUSTOMER)

  if (hashOtp(code, email) !== storedHash) {
    await customerModule.updateCustomers(customer.id, {
      metadata: { ...meta, login_otp_attempts: attempts + 1 },
    })
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "That code is incorrect. Please try again."
    )
  }

  // Correct code — clear the OTP state.
  const cleaned: Record<string, unknown> = { ...meta }
  delete cleaned.login_otp_hash
  delete cleaned.login_otp_expires
  delete cleaned.login_otp_last_sent
  delete cleaned.login_otp_attempts
  await customerModule.updateCustomers(customer.id, { metadata: cleaned })

  // Mint the customer session token. A registered customer has an emailpass
  // auth identity we mirror into the token; a guest customer (created at
  // checkout, no auth identity) gets a session keyed only on its customer id —
  // the bearer middleware authenticates on actor_id/actor_type and never
  // re-checks the auth identity, and email possession is the proven credential.
  const authIdentityId = await findEmailpassAuthIdentityId(req.scope, email)

  let authIdentityIdForToken = ""
  let appMetadata: Record<string, unknown> = { customer_id: customer.id }
  let userMetadata: Record<string, unknown> = {}

  if (authIdentityId) {
    const authModule = req.scope.resolve(Modules.AUTH)
    const authIdentity = (await authModule.retrieveAuthIdentity(authIdentityId, {
      relations: ["provider_identities"],
    })) as {
      id: string
      app_metadata?: Record<string, unknown> | null
      provider_identities?: Array<{
        provider: string
        user_metadata?: Record<string, unknown> | null
      }>
    }
    authIdentityIdForToken = authIdentity.id
    appMetadata = {
      ...(authIdentity.app_metadata ?? {}),
      customer_id: customer.id,
    }
    userMetadata =
      authIdentity.provider_identities?.find((p) => p.provider === "emailpass")
        ?.user_metadata ?? {}
  }

  const config: any = req.scope.resolve(
    ContainerRegistrationKeys.CONFIG_MODULE
  )
  const http = config.projectConfig.http

  const token = generateJwtToken(
    {
      actor_id: customer.id,
      actor_type: "customer",
      auth_identity_id: authIdentityIdForToken,
      ...(authIdentityId ? { auth_provider: "emailpass" } : {}),
      app_metadata: appMetadata,
      user_metadata: userMetadata,
    },
    {
      secret: http.jwtSecret,
      expiresIn: http.jwtExpiresIn ?? "7d",
      jwtOptions: http.jwtOptions,
    }
  )

  res.status(200).json({ token })
}

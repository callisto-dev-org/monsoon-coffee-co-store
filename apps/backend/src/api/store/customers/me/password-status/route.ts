import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

// Reports whether the authenticated customer already has a password, so the
// account settings UI can label the field "Set" vs "Change". Auto-protected
// under `/store/customers/me/*`.
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const customerId = req.auth_context.actor_id

  const customerModule = req.scope.resolve(Modules.CUSTOMER)
  const customer = await customerModule
    .retrieveCustomer(customerId, { select: ["id", "email"] })
    .catch(() => null)
  const email = (customer?.email ?? "").trim().toLowerCase()

  let hasPassword = false
  if (email) {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "provider_identity",
      fields: ["auth_identity_id"],
      filters: { entity_id: email, provider: "emailpass" },
    })
    hasPassword = !!data?.[0]
  }

  res.status(200).json({ has_password: hasPassword })
}

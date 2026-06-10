import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

export type RegisteredCustomer = {
  id: string
  email: string
  has_account?: boolean
  metadata?: Record<string, unknown> | null
}

// Resolve the account-bearing customer for an email. A guest customer and a
// registered customer can share an email, so prefer the one with `has_account`.
export async function findCustomerByEmail(
  scope: MedusaContainer,
  email: string
): Promise<RegisteredCustomer | null> {
  const customerModule = scope.resolve(Modules.CUSTOMER)
  const customers = (await customerModule.listCustomers(
    { email },
    { select: ["id", "email", "has_account", "metadata"] }
  )) as RegisteredCustomer[]
  return customers.find((c) => c.has_account) ?? customers[0] ?? null
}

// The id of the emailpass auth identity backing this email, or null if there's
// no password account for it. Mirrors the lookup used by the core reset-password
// flow (`provider_identity` filtered by entity_id + provider).
export async function findEmailpassAuthIdentityId(
  scope: MedusaContainer,
  email: string
): Promise<string | null> {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "provider_identity",
    fields: ["auth_identity_id"],
    filters: { entity_id: email, provider: "emailpass" },
  })
  return (data?.[0]?.auth_identity_id as string | undefined) ?? null
}

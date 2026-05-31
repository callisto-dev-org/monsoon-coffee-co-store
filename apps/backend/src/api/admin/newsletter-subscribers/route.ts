import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// Admin: list newsletter subscribers, newest first.
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: subscribers } = await query.graph({
    entity: "newsletter_subscriber",
    fields: ["id", "email", "status", "created_at"],
    pagination: { take: 1000, order: { created_at: "DESC" } },
  })

  res.json({ newsletter_subscribers: subscribers })
}

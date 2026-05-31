import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// Admin: newsletter send history, newest first.
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: campaigns } = await query.graph({
    entity: "newsletter_campaign",
    fields: [
      "id",
      "subject",
      "recipients",
      "sent",
      "failed",
      "status",
      "created_at",
    ],
    pagination: { take: 100, order: { created_at: "DESC" } },
  })

  res.json({ newsletter_campaigns: campaigns })
}

import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// Admin: list contact messages, newest first. Admin routes are authenticated
// by the framework automatically.
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: messages } = await query.graph({
    entity: "contact_message",
    fields: [
      "id",
      "name",
      "email",
      "subject",
      "message",
      "status",
      "created_at",
    ],
    pagination: { take: 500, order: { created_at: "DESC" } },
  })

  res.json({ contact_messages: messages })
}

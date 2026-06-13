import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// Lists every event detail row so the Events admin page can render a table
// without N per-product requests.
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: event_details } = await query.graph({
    entity: "event_detail",
    fields: [
      "id",
      "product_id",
      "partner",
      "venue",
      "city",
      "date_label",
      "event_date",
      "seats_total",
    ],
    pagination: { take: 1000, skip: 0 },
  })
  res.json({ event_details })
}

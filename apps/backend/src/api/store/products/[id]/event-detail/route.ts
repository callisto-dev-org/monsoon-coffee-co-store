import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

const EVENT_FIELDS = [
  "id",
  "product_id",
  "partner",
  "venue",
  "city",
  "date_label",
  "event_date",
  "start_time",
  "end_time",
  "seats_total",
  "booking_closed",
  "description",
  "highlights",
  "images",
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const productId = req.params.id
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: details } = await query.graph({
    entity: "event_detail",
    fields: EVENT_FIELDS,
    filters: { product_id: productId },
  })
  res.json({ event_detail: details[0] ?? null })
}

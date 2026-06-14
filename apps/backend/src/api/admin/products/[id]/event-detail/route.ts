import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  upsertEventDetailWorkflow,
  deleteEventDetailWorkflow,
} from "../../../../../workflows/event-detail"
import type { UpsertEventDetailSchema } from "./middlewares"

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
  "description",
  "highlights",
  "images",
  "created_at",
  "updated_at",
]

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const productId = req.params.id
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: details } = await query.graph({
    entity: "event_detail",
    fields: EVENT_FIELDS,
    filters: { product_id: productId },
  })
  res.json({ event_detail: details[0] ?? null })
}

export async function POST(
  req: AuthenticatedMedusaRequest<UpsertEventDetailSchema>,
  res: MedusaResponse
) {
  const productId = req.params.id
  const { result } = await upsertEventDetailWorkflow(req.scope).run({
    input: { product_id: productId, ...req.validatedBody },
  })
  res.json({ event_detail: result })
}

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const productId = req.params.id
  await deleteEventDetailWorkflow(req.scope).run({
    input: { product_id: productId },
  })
  res.json({ product_id: productId, deleted: true })
}

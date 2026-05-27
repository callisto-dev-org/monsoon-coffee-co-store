import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  upsertCoffeeProfileWorkflow,
  deleteCoffeeProfileWorkflow,
} from "../../../../../workflows/coffee-profile"
import type { UpsertCoffeeProfileSchema } from "./middlewares"

const PROFILE_FIELDS = [
  "id",
  "product_id",
  "origin",
  "altitude_m",
  "varietal",
  "process",
  "roast_level",
  "roast_date",
  "harvest_year",
  "recommended_ratio",
  "tasting_notes",
  "custom_labels",
  "extraction_profile",
  "created_at",
  "updated_at",
]

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const productId = req.params.id
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: profiles } = await query.graph({
    entity: "coffee_profile",
    fields: PROFILE_FIELDS,
    filters: { product_id: productId },
  })
  res.json({ coffee_profile: profiles[0] ?? null })
}

export async function POST(
  req: AuthenticatedMedusaRequest<UpsertCoffeeProfileSchema>,
  res: MedusaResponse
) {
  const productId = req.params.id
  const { result } = await upsertCoffeeProfileWorkflow(req.scope).run({
    input: { product_id: productId, ...req.validatedBody },
  })
  res.json({ coffee_profile: result })
}

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const productId = req.params.id
  await deleteCoffeeProfileWorkflow(req.scope).run({
    input: { product_id: productId },
  })
  res.json({ product_id: productId, deleted: true })
}

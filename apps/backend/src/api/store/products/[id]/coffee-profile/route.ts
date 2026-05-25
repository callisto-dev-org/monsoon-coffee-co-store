import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

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
  "extraction_profile",
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const productId = req.params.id
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: profiles } = await query.graph({
    entity: "coffee_profile",
    fields: PROFILE_FIELDS,
    filters: { product_id: productId },
  })
  res.json({ coffee_profile: profiles[0] ?? null })
}

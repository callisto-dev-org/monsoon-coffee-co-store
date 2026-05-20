import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// Admin variant of /store/products/:id/brews — same data, separate
// auth surface so the admin app doesn't need a publishable key.
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const id = req.params.id
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: recipes } = await query.graph({
    entity: "brew_recipe",
    fields: [
      "id",
      "product_id",
      "title",
      "summary",
      "params",
      "steps",
      "brew_method.*",
    ],
    filters: { product_id: id },
    pagination: { take: 100 },
  })

  res.json({ brew_recipes: recipes })
}

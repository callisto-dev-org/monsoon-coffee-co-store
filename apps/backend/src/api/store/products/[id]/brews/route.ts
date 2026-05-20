import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// Public: list brew recipes for a product, ordered by their method's position.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
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
      "brew_method.id",
      "brew_method.slug",
      "brew_method.name",
      "brew_method.method_label",
      "brew_method.summary",
      "brew_method.image_url",
      "brew_method.param_schema",
      "brew_method.steps",
    ],
    filters: { product_id: id },
    pagination: { take: 100 },
  })

  res.json({ brew_recipes: recipes })
}

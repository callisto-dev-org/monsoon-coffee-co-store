import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createBrewRecipeWorkflow } from "../../../workflows/brew-recipe"
import type { CreateBrewRecipeSchema } from "./middlewares"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const filters: Record<string, unknown> = {}
  if (req.query.product_id) filters.product_id = req.query.product_id
  if (req.query.brew_method_id) {
    filters.brew_method_id = req.query.brew_method_id
  }

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
      "created_at",
      "updated_at",
    ],
    filters,
    pagination: { take: 500 },
  })

  res.json({ brew_recipes: recipes })
}

export async function POST(
  req: AuthenticatedMedusaRequest<CreateBrewRecipeSchema>,
  res: MedusaResponse
) {
  const { result } = await createBrewRecipeWorkflow(req.scope).run({
    input: req.validatedBody,
  })
  res.json({ brew_recipe: result })
}

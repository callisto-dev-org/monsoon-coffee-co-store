import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  deleteBrewRecipeWorkflow,
  updateBrewRecipeWorkflow,
} from "../../../../workflows/brew-recipe"
import type { UpdateBrewRecipeSchema } from "../middlewares"

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
    filters: { id },
  })
  res.json({ brew_recipe: recipes[0] || null })
}

export async function POST(
  req: AuthenticatedMedusaRequest<UpdateBrewRecipeSchema>,
  res: MedusaResponse
) {
  const id = req.params.id
  const { result } = await updateBrewRecipeWorkflow(req.scope).run({
    input: { id, ...req.validatedBody },
  })
  res.json({ brew_recipe: result })
}

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const id = req.params.id
  await deleteBrewRecipeWorkflow(req.scope).run({ input: { id } })
  res.json({ id, deleted: true })
}

import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  deleteBrewMethodWorkflow,
  updateBrewMethodWorkflow,
} from "../../../../workflows/brew-method"
import type { UpdateBrewMethodSchema } from "../middlewares"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const id = req.params.id
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: methods } = await query.graph({
    entity: "brew_method",
    fields: [
      "id",
      "slug",
      "name",
      "method_label",
      "summary",
      "image_url",
      "param_schema",
      "steps",
      "recipes.*",
    ],
    filters: { id },
  })

  res.json({ brew_method: methods[0] || null })
}

export async function POST(
  req: AuthenticatedMedusaRequest<UpdateBrewMethodSchema>,
  res: MedusaResponse
) {
  const id = req.params.id
  const { result } = await updateBrewMethodWorkflow(req.scope).run({
    input: { id, ...req.validatedBody },
  })
  res.json({ brew_method: result })
}

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const id = req.params.id
  await deleteBrewMethodWorkflow(req.scope).run({ input: { id } })
  res.json({ id, deleted: true })
}

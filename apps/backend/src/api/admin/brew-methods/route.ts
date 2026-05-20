import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  createBrewMethodWorkflow,
} from "../../../workflows/brew-method"
import type { CreateBrewMethodSchema } from "./middlewares"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
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
      "created_at",
      "updated_at",
    ],
    pagination: {
      take: 200,
      order: { created_at: "ASC" },
    },
  })

  res.json({ brew_methods: methods })
}

export async function POST(
  req: AuthenticatedMedusaRequest<CreateBrewMethodSchema>,
  res: MedusaResponse
) {
  const { result } = await createBrewMethodWorkflow(req.scope).run({
    input: req.validatedBody,
  })
  res.json({ brew_method: result })
}

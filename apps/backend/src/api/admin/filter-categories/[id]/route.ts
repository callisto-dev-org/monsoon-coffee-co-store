import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  deleteFilterCategoryWorkflow,
  updateFilterCategoryWorkflow,
} from "../../../../workflows/filter-category"
import type { UpdateFilterCategorySchema } from "../middlewares"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const id = req.params.id
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: categories } = await query.graph({
    entity: "filter_category",
    fields: ["id", "name", "handle", "rank", "tag_ids"],
    filters: { id },
  })

  res.json({ filter_category: categories[0] || null })
}

export async function POST(
  req: AuthenticatedMedusaRequest<UpdateFilterCategorySchema>,
  res: MedusaResponse
) {
  const id = req.params.id
  const { result } = await updateFilterCategoryWorkflow(req.scope).run({
    input: { id, ...req.validatedBody },
  })
  res.json({ filter_category: result })
}

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const id = req.params.id
  await deleteFilterCategoryWorkflow(req.scope).run({ input: { id } })
  res.json({ id, deleted: true })
}

import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createFilterCategoryWorkflow } from "../../../workflows/filter-category"
import type { CreateFilterCategorySchema } from "./middlewares"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: categories } = await query.graph({
    entity: "filter_category",
    fields: [
      "id",
      "name",
      "handle",
      "rank",
      "tag_ids",
      "created_at",
      "updated_at",
    ],
    pagination: {
      take: 200,
      order: { rank: "ASC", created_at: "ASC" },
    },
  })

  res.json({ filter_categories: categories })
}

export async function POST(
  req: AuthenticatedMedusaRequest<CreateFilterCategorySchema>,
  res: MedusaResponse
) {
  const { result } = await createFilterCategoryWorkflow(req.scope).run({
    input: req.validatedBody,
  })
  res.json({ filter_category: result })
}

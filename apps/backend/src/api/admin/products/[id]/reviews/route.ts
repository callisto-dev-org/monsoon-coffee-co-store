import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// Admin variant of /store/products/:id/reviews — returns every review for
// the product (including pending/rejected) so admins can moderate.
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const id = req.params.id
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: reviews } = await query.graph({
    entity: "review",
    fields: [
      "id",
      "product_id",
      "customer_id",
      "customer_name",
      "variant_id",
      "variant_title",
      "rating",
      "title",
      "body",
      "images",
      "status",
      "created_at",
    ],
    filters: { product_id: id },
    pagination: { take: 500, order: { created_at: "DESC" } },
  })

  const count = reviews.length
  const avg = count
    ? reviews.reduce((s: number, r: any) => s + (r.rating || 0), 0) / count
    : 0

  res.json({
    reviews,
    summary: {
      count,
      average_rating: Number(avg.toFixed(2)),
    },
  })
}

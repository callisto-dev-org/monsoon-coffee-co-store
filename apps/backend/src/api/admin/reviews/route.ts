import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// Cross-product moderation list. Supports optional filters via query string:
//   - product_id
//   - status   (one of pending | published | rejected)
//   - rating   (1–5)
//   - q        (substring match across title + body, case-insensitive)
//   - limit / offset (defaults 50 / 0)
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const q = req.query as Record<string, string | undefined>
  const filters: Record<string, unknown> = {}

  if (q.product_id) filters.product_id = q.product_id
  if (q.status) filters.status = q.status
  if (q.rating) {
    const r = Number(q.rating)
    if (Number.isFinite(r) && r >= 1 && r <= 5) filters.rating = r
  }

  const take = Math.min(200, Math.max(1, Number(q.limit) || 50))
  const skip = Math.max(0, Number(q.offset) || 0)

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: reviews, metadata } = await query.graph({
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
    filters,
    pagination: { take, skip, order: { created_at: "DESC" } },
  })

  // Free-text filter is applied in-memory because query.graph doesn't expose
  // ILIKE on jsonb-free text columns. The result set is already small.
  let filtered = reviews
  const search = (q.q || "").trim().toLowerCase()
  if (search) {
    filtered = reviews.filter((r: any) => {
      const hay = `${r.title || ""}\n${r.body || ""}\n${r.customer_name || ""}`.toLowerCase()
      return hay.includes(search)
    })
  }

  // Aggregate summary across the matched set so the admin sees what they're
  // looking at, not what's in the whole DB.
  const count = filtered.length
  const avg = count
    ? filtered.reduce((s: number, r: any) => s + (r.rating || 0), 0) / count
    : 0
  const byStatus = filtered.reduce<Record<string, number>>((acc, r: any) => {
    acc[r.status] = (acc[r.status] || 0) + 1
    return acc
  }, {})

  res.json({
    reviews: filtered,
    total: metadata?.count ?? filtered.length,
    summary: {
      count,
      average_rating: Number(avg.toFixed(2)),
      by_status: byStatus,
    },
  })
}

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// Public read of filter categories with their product tags resolved. The
// storefront uses this to render the /store filter UI dynamically.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  let categories: Array<{
    id: string
    name: string
    handle: string
    rank: number
    tag_ids?: string[] | null
  }> = []
  try {
    const { data } = await query.graph({
      entity: "filter_category",
      fields: ["id", "name", "handle", "rank", "tag_ids"],
      pagination: { take: 200, order: { rank: "ASC", created_at: "ASC" } },
    })
    categories = (data ?? []) as typeof categories
  } catch {
    res.json({ filter_categories: [] })
    return
  }

  // Collect every tag id referenced by any category, then resolve all
  // product_tag rows in one shot.
  const allTagIds = Array.from(
    new Set(
      categories.flatMap((c) =>
        Array.isArray(c.tag_ids) ? c.tag_ids.filter(Boolean) : []
      )
    )
  )

  let tagsById = new Map<string, { id: string; value: string }>()
  if (allTagIds.length > 0) {
    try {
      const { data: tags } = await query.graph({
        entity: "product_tag",
        fields: ["id", "value"],
        filters: { id: allTagIds },
        pagination: { take: 500 },
      })
      tagsById = new Map(
        (tags ?? []).map((t: { id: string; value: string }) => [t.id, t])
      )
    } catch {
      // Treat as no tags available rather than failing the request.
    }
  }

  // Hydrate each category with its tags in the order they were assigned,
  // dropping any stale ids whose product_tag no longer exists.
  const resolved = categories.map((c) => ({
    id: c.id,
    name: c.name,
    handle: c.handle,
    rank: c.rank ?? 0,
    tags: (c.tag_ids ?? [])
      .map((tid) => tagsById.get(tid))
      .filter((t): t is { id: string; value: string } => !!t),
  }))

  res.json({ filter_categories: resolved })
}

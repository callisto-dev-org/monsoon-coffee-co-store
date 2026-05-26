import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// Public read of the brew visibility settings. The storefront uses this to
// decide whether to render the brew lab section on a product page.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  try {
    const { data } = await query.graph({
      entity: "brew_settings",
      fields: ["enabled_product_type_ids"],
      pagination: { take: 1 },
    })
    const row = data?.[0] as
      | { enabled_product_type_ids?: string[] | null }
      | undefined
    res.json({
      enabled_product_type_ids: row?.enabled_product_type_ids ?? [],
    })
  } catch {
    res.json({ enabled_product_type_ids: [] })
  }
}

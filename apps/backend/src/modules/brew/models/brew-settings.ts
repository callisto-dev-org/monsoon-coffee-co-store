import { model } from "@medusajs/framework/utils"

// Singleton settings row for the brew module. We rely on the convention
// that exactly one row exists; the API route upserts it on first read.
const BrewSettings = model.define("brew_settings", {
  id: model.id().primaryKey(),
  // IDs of product_type rows where the brew-recipes widget (admin) and
  // brew lab section (storefront) should appear.
  enabled_product_type_ids: model.json().nullable(),
})

export default BrewSettings

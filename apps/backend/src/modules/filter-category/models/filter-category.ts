import { model } from "@medusajs/framework/utils"

// A grouping of Medusa product tags surfaced as a filter section on the
// storefront. Tag IDs reference Medusa's built-in `product_tag` entity.
const FilterCategory = model.define("filter_category", {
  id: model.id().primaryKey(),
  name: model.text(), // e.g. "Origin"
  handle: model.text().unique(), // e.g. "origin"
  rank: model.number().default(0),
  // Array of product_tag IDs that should appear under this category.
  tag_ids: model.json().nullable(),
  metadata: model.json().nullable(),
})

export default FilterCategory

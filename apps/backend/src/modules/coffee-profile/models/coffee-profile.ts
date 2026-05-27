import { model } from "@medusajs/framework/utils"

// Per-product technical spec sheet for a coffee. Linked 1:1 to a Medusa
// product via src/links/coffee-profile-product.ts. `product_id` is mirrored
// here for fast lookups and ownership without joining through the link table.
const CoffeeProfile = model.define("coffee_profile", {
  id: model.id().primaryKey(),
  product_id: model.text().unique(),

  origin: model.text().nullable(),
  altitude_m: model.number().nullable(),
  varietal: model.text().nullable(),
  process: model.text().nullable(),
  roast_level: model.text().nullable(),
  roast_date: model.dateTime().nullable(),
  harvest_year: model.number().nullable(),
  recommended_ratio: model.text().nullable(),

  tasting_notes: model.json().nullable(),

  // Admin-defined label categories beyond the built-in three. Shape:
  //   { [categoryId]: string | number | string[] }
  custom_labels: model.json().nullable(),

  // Ordered list of extraction samples for the chart. Each point:
  //   { time_s: number; yield_g: number; tds?: number }
  // Plotting time_s on x and yield_g on y gives the extraction curve.
  extraction_profile: model.json().nullable(),
})

export default CoffeeProfile

import { model } from "@medusajs/framework/utils"
import BrewMethod from "./brew-method"

// Per-product brew protocol values. The product link is created via
// src/links/brew-recipe-product.ts; product_id is mirrored here for
// fast lookups and ownership without joining through the link table.
const BrewRecipe = model.define("brew_recipe", {
  id: model.id().primaryKey(),
  product_id: model.text().index(),
  title: model.text().nullable(), // e.g. "PRECISION CLARITY"
  summary: model.text().nullable(), // per-bean tasting note override
  // Free-form key/value pairs matching the parent method's param_schema.
  // e.g. { grain_size: "MEDIUM-FINE", temp: "94°C", water: "300ML", extraction: "92%", yield: "220ML" }
  params: model.json().nullable(),
  // Ordered brew steps: [{ name: "Step 01", description: "..." }, ...]
  steps: model.json().nullable(),
  brew_method: model.belongsTo(() => BrewMethod, { mappedBy: "recipes" }),
})

export default BrewRecipe

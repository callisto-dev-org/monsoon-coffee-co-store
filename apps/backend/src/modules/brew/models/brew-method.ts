import { model } from "@medusajs/framework/utils"
import BrewRecipe from "./brew-recipe"

// A brew/extraction protocol shared across products (e.g. V60, French Press).
// The shape & defaults live here; per-bean values live in BrewRecipe.
const BrewMethod = model.define("brew_method", {
  id: model.id().primaryKey(),
  slug: model.text().unique(),
  name: model.text(), // e.g. "V60"
  method_label: model.text().nullable(), // e.g. "POUR-OVER"
  summary: model.text().nullable(),
  image_url: model.text().nullable(),
  // Optional schema describing which params this method tracks (UI hint).
  // e.g. [{ key: "grain_size", label: "Grain size" }, { key: "temp", label: "Temp", unit: "°C" }]
  param_schema: model.json().nullable(),
  // Default brew steps for this technique (same across beans).
  // Per-recipe overrides via BrewRecipe.steps are still supported but optional.
  // e.g. [{ name: "Step 01", description: "Medium-fine grind, 1:16 ratio." }, ...]
  steps: model.json().nullable(),
  recipes: model.hasMany(() => BrewRecipe, { mappedBy: "brew_method" }),
})

export default BrewMethod

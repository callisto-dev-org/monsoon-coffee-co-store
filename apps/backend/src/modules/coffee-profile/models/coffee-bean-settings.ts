import { model } from "@medusajs/framework/utils"

// Singleton row storing extension-level configuration for the Coffee Beans
// admin section. label_categories is a dynamic list of categories the
// operator can define (e.g. Roast levels, Processes, Tasting notes), each
// with its own list of values. Stored as `[{ id, name, values }]`.
const CoffeeBeanSettings = model.define("coffee_bean_settings", {
  id: model.id().primaryKey(),
  label_categories: model.json().nullable(),
})

export default CoffeeBeanSettings

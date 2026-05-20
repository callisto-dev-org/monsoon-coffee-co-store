import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"
import BrewModule from "../modules/brew"

// A product can have many brew recipes (one per linked extraction method).
// Each recipe links to exactly one product.
export default defineLink(
  ProductModule.linkable.product,
  {
    linkable: BrewModule.linkable.brewRecipe,
    isList: true,
    deleteCascade: true,
  }
)

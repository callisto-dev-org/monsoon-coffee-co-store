import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"
import CoffeeProfileModule from "../modules/coffee-profile"

// One coffee profile per product. The profile is deleted with the product.
export default defineLink(
  ProductModule.linkable.product,
  {
    linkable: CoffeeProfileModule.linkable.coffeeProfile,
    deleteCascade: true,
  }
)

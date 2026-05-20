import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"
import ReviewModule from "../modules/review"

// A product has many reviews; deleting the product cascades and removes
// the link entries for its reviews.
export default defineLink(
  ProductModule.linkable.product,
  {
    linkable: ReviewModule.linkable.review,
    isList: true,
    deleteCascade: true,
  }
)

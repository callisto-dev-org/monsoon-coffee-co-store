import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"
import EventDetailModule from "../modules/event-detail"

// One event sheet per product. The event detail is deleted with the product.
export default defineLink(ProductModule.linkable.product, {
  linkable: EventDetailModule.linkable.eventDetail,
  deleteCascade: true,
})

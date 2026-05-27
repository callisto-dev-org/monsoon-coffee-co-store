import { authenticate, defineMiddlewares } from "@medusajs/framework/http"
import { brewMethodMiddlewares } from "./admin/brew-methods/middlewares"
import { brewRecipeMiddlewares } from "./admin/brew-recipes/middlewares"
import { brewSettingsMiddlewares } from "./admin/brew-settings/middlewares"
import { coffeeProfileMiddlewares } from "./admin/products/[id]/coffee-profile/middlewares"
import { filterCategoryMiddlewares } from "./admin/filter-categories/middlewares"
import { reviewStoreMiddlewares } from "./store/products/[id]/reviews/middlewares"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/orders/:id/cancel",
      method: "POST",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      matcher: "/store/orders/:id/refund",
      method: "POST",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    ...brewMethodMiddlewares,
    ...brewRecipeMiddlewares,
    ...brewSettingsMiddlewares,
    ...coffeeProfileMiddlewares,
    ...filterCategoryMiddlewares,
    ...reviewStoreMiddlewares,
  ],
})

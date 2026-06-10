import { authenticate, defineMiddlewares } from "@medusajs/framework/http"
import { brewMethodMiddlewares } from "./admin/brew-methods/middlewares"
import { brewRecipeMiddlewares } from "./admin/brew-recipes/middlewares"
import { brewSettingsMiddlewares } from "./admin/brew-settings/middlewares"
import { coffeeBeanSettingsMiddlewares } from "./admin/coffee-bean-settings/middlewares"
import { coffeeProfileMiddlewares } from "./admin/products/[id]/coffee-profile/middlewares"
import { filterCategoryMiddlewares } from "./admin/filter-categories/middlewares"
import { reviewStoreMiddlewares } from "./store/products/[id]/reviews/middlewares"
import { contactStoreMiddlewares } from "./store/contact/middlewares"
import { newsletterStoreMiddlewares } from "./store/newsletter/middlewares"
import { guestOtpStoreMiddlewares } from "./store/guest-otp/middlewares"
import { authOtpStoreMiddlewares } from "./store/auth-otp/middlewares"
import { customerMeStoreMiddlewares } from "./store/customers/me/middlewares"
import { contactMessageAdminMiddlewares } from "./admin/contact-messages/middlewares"
import { newsletterAdminMiddlewares } from "./admin/newsletter/middlewares"

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
    ...coffeeBeanSettingsMiddlewares,
    ...coffeeProfileMiddlewares,
    ...filterCategoryMiddlewares,
    ...reviewStoreMiddlewares,
    ...contactStoreMiddlewares,
    ...newsletterStoreMiddlewares,
    ...guestOtpStoreMiddlewares,
    ...authOtpStoreMiddlewares,
    ...customerMeStoreMiddlewares,
    ...contactMessageAdminMiddlewares,
    ...newsletterAdminMiddlewares,
  ],
})

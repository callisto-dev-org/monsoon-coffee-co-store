import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import { RazorpayProviderService } from "./services"

export default ModuleProvider(Modules.PAYMENT, {
  services: [RazorpayProviderService],
})

import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import { PhonePeProviderService } from "./services"

export default ModuleProvider(Modules.PAYMENT, {
  services: [PhonePeProviderService],
})

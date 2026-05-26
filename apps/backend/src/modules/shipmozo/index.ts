import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import { ShipmozoProviderService } from "./services"

export default ModuleProvider(Modules.FULFILLMENT, {
  services: [ShipmozoProviderService],
})

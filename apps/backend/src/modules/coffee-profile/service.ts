import { MedusaService } from "@medusajs/framework/utils"
import CoffeeProfile from "./models/coffee-profile"

class CoffeeProfileModuleService extends MedusaService({
  CoffeeProfile,
}) {}

export default CoffeeProfileModuleService

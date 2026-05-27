import { MedusaService } from "@medusajs/framework/utils"
import CoffeeProfile from "./models/coffee-profile"
import CoffeeBeanSettings from "./models/coffee-bean-settings"

class CoffeeProfileModuleService extends MedusaService({
  CoffeeProfile,
  CoffeeBeanSettings,
}) {}

export default CoffeeProfileModuleService

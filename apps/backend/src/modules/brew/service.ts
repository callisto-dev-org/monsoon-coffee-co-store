import { MedusaService } from "@medusajs/framework/utils"
import BrewMethod from "./models/brew-method"
import BrewRecipe from "./models/brew-recipe"
import BrewSettings from "./models/brew-settings"

class BrewModuleService extends MedusaService({
  BrewMethod,
  BrewRecipe,
  BrewSettings,
}) {}

export default BrewModuleService

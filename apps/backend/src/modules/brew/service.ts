import { MedusaService } from "@medusajs/framework/utils"
import BrewMethod from "./models/brew-method"
import BrewRecipe from "./models/brew-recipe"

class BrewModuleService extends MedusaService({
  BrewMethod,
  BrewRecipe,
}) {}

export default BrewModuleService

import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  upsertCoffeeBeanSettingsStep,
  type CoffeeBeanSettingsInput,
} from "./steps/coffee-bean-settings-steps"

export const updateCoffeeBeanSettingsWorkflow = createWorkflow(
  "update-coffee-bean-settings",
  function (input: CoffeeBeanSettingsInput) {
    const settings = upsertCoffeeBeanSettingsStep(input)
    return new WorkflowResponse(settings)
  }
)

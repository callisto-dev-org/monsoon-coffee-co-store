import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { upsertBrewSettingsStep } from "./steps/brew-settings-steps"

export const updateBrewSettingsWorkflow = createWorkflow(
  "update-brew-settings",
  function (input: { enabled_product_category_ids: string[] | null }) {
    const settings = upsertBrewSettingsStep(input)
    return new WorkflowResponse(settings)
  }
)

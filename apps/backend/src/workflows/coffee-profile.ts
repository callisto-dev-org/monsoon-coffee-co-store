import { Modules } from "@medusajs/framework/utils"
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows"
import { COFFEE_PROFILE_MODULE } from "../modules/coffee-profile"
import {
  upsertCoffeeProfileStep,
  deleteCoffeeProfileStep,
  type CoffeeProfileInput,
} from "./steps/coffee-profile-steps"
import { syncProfileFilterCategoriesStep } from "./steps/sync-profile-filter-categories-steps"

export const upsertCoffeeProfileWorkflow = createWorkflow(
  "upsert-coffee-profile",
  function (input: CoffeeProfileInput & { product_id: string }) {
    const result = upsertCoffeeProfileStep(input)

    // Only create the module link the first time the profile is created.
    // createRemoteLinkStep is idempotent enough to not double-link, but we
    // skip it on updates to avoid an unnecessary call.
    const linkData = transform(
      { result, input },
      ({ result, input }) => {
        if (!result.created) return []
        return [
          {
            [Modules.PRODUCT]: { product_id: input.product_id },
            [COFFEE_PROFILE_MODULE]: {
              coffee_profile_id: result.profile.id,
            },
          },
        ]
      }
    )

    createRemoteLinkStep(linkData)

    // Mirror the profile's select-one / select-many label categories into
    // storefront tagging (filter) categories, and tag the product with its
    // own selected values. Idempotent and never throws.
    const syncInput = transform({ result, input }, ({ result, input }) => ({
      product_id: input.product_id,
      profile: result.profile,
    }))
    syncProfileFilterCategoriesStep(syncInput)

    return new WorkflowResponse(result.profile)
  }
)

export const deleteCoffeeProfileWorkflow = createWorkflow(
  "delete-coffee-profile",
  function (input: { product_id: string }) {
    const id = deleteCoffeeProfileStep(input)
    return new WorkflowResponse(id)
  }
)

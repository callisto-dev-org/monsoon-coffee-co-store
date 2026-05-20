import { Modules } from "@medusajs/framework/utils"
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows"
import { BREW_MODULE } from "../modules/brew"
import {
  createBrewRecipeStep,
  updateBrewRecipeStep,
  deleteBrewRecipeStep,
  type StepDef,
} from "./steps/brew-recipe-steps"

export const createBrewRecipeWorkflow = createWorkflow(
  "create-brew-recipe",
  function (input: {
    product_id: string
    brew_method_id: string
    title?: string | null
    summary?: string | null
    params?: Record<string, unknown> | null
    steps?: StepDef[] | null
  }) {
    const recipe = createBrewRecipeStep(input)

    // Mirror the recipe→product relationship as a module link so other
    // modules (and query.graph) can traverse product → brew_recipe.*
    const linkData = transform(
      { recipe, input },
      ({ recipe, input }) => [
        {
          [Modules.PRODUCT]: { product_id: input.product_id },
          [BREW_MODULE]: { brew_recipe_id: (recipe as { id: string }).id },
        },
      ]
    )

    createRemoteLinkStep(linkData)

    return new WorkflowResponse(recipe)
  }
)

export const updateBrewRecipeWorkflow = createWorkflow(
  "update-brew-recipe",
  function (input: {
    id: string
    title?: string | null
    summary?: string | null
    params?: Record<string, unknown> | null
    steps?: StepDef[] | null
  }) {
    const recipe = updateBrewRecipeStep(input)
    return new WorkflowResponse(recipe)
  }
)

export const deleteBrewRecipeWorkflow = createWorkflow(
  "delete-brew-recipe",
  function (input: { id: string }) {
    const id = deleteBrewRecipeStep(input)
    return new WorkflowResponse(id)
  }
)

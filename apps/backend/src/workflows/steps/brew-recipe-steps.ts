import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { BREW_MODULE } from "../../modules/brew"

export type StepDef = { name: string; description: string }

export const createBrewRecipeStep = createStep(
  "create-brew-recipe",
  async (
    input: {
      product_id: string
      brew_method_id: string
      title?: string | null
      summary?: string | null
      params?: Record<string, unknown> | null
      steps?: StepDef[] | null
    },
    { container }
  ) => {
    const svc: any = container.resolve(BREW_MODULE)
    const recipe = await svc.createBrewRecipes({
      product_id: input.product_id,
      brew_method_id: input.brew_method_id,
      title: input.title ?? null,
      summary: input.summary ?? null,
      params: input.params ?? null,
      steps: input.steps ?? null,
    })
    return new StepResponse(recipe, recipe.id)
  },
  async (id, { container }) => {
    if (!id) return
    const svc: any = container.resolve(BREW_MODULE)
    await svc.deleteBrewRecipes(id)
  }
)

export const updateBrewRecipeStep = createStep(
  "update-brew-recipe",
  async (
    input: {
      id: string
      title?: string | null
      summary?: string | null
      params?: Record<string, unknown> | null
      steps?: StepDef[] | null
    },
    { container }
  ) => {
    const svc: any = container.resolve(BREW_MODULE)
    const before = await svc.retrieveBrewRecipe(input.id)
    const updated = await svc.updateBrewRecipes(input)
    return new StepResponse(updated, before)
  },
  async (before, { container }) => {
    if (!before) return
    const svc: any = container.resolve(BREW_MODULE)
    await svc.updateBrewRecipes({
      id: before.id,
      title: before.title,
      summary: before.summary,
      params: before.params,
      steps: before.steps,
    })
  }
)

export const deleteBrewRecipeStep = createStep(
  "delete-brew-recipe",
  async (input: { id: string }, { container }) => {
    const svc: any = container.resolve(BREW_MODULE)
    await svc.deleteBrewRecipes(input.id)
    return new StepResponse(input.id)
  }
)

import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { BREW_MODULE } from "../../modules/brew"

export const createBrewMethodStep = createStep(
  "create-brew-method",
  async (
    input: {
      slug: string
      name: string
      method_label?: string | null
      summary?: string | null
      image_url?: string | null
      param_schema?: unknown
      steps?: unknown
    },
    { container }
  ) => {
    const svc: any = container.resolve(BREW_MODULE)
    const method = await svc.createBrewMethods(input)
    return new StepResponse(method, method.id)
  },
  async (id, { container }) => {
    if (!id) return
    const svc: any = container.resolve(BREW_MODULE)
    await svc.deleteBrewMethods(id)
  }
)

export const updateBrewMethodStep = createStep(
  "update-brew-method",
  async (
    input: {
      id: string
      slug?: string
      name?: string
      method_label?: string | null
      summary?: string | null
      image_url?: string | null
      param_schema?: unknown
      steps?: unknown
    },
    { container }
  ) => {
    const svc: any = container.resolve(BREW_MODULE)
    const before = await svc.retrieveBrewMethod(input.id)
    const updated = await svc.updateBrewMethods(input)
    return new StepResponse(updated, before)
  },
  async (before, { container }) => {
    if (!before) return
    const svc: any = container.resolve(BREW_MODULE)
    await svc.updateBrewMethods({
      id: before.id,
      slug: before.slug,
      name: before.name,
      method_label: before.method_label,
      summary: before.summary,
      image_url: before.image_url,
      param_schema: before.param_schema,
      steps: before.steps,
    })
  }
)

export const deleteBrewMethodStep = createStep(
  "delete-brew-method",
  async (input: { id: string }, { container }) => {
    const svc: any = container.resolve(BREW_MODULE)
    await svc.deleteBrewMethods(input.id)
    return new StepResponse(input.id)
  }
)

import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { FILTER_CATEGORY_MODULE } from "../../modules/filter-category"

type CreateInput = {
  name: string
  handle: string
  rank?: number
  tag_ids?: string[]
}

type UpdateInput = {
  id: string
  name?: string
  handle?: string
  rank?: number
  tag_ids?: string[]
}

export const createFilterCategoryStep = createStep(
  "create-filter-category",
  async (input: CreateInput, { container }) => {
    const svc: any = container.resolve(FILTER_CATEGORY_MODULE)
    const created = await svc.createFilterCategories({
      name: input.name,
      handle: input.handle,
      rank: input.rank ?? 0,
      tag_ids: input.tag_ids ?? [],
    })
    return new StepResponse(created, created.id)
  },
  async (id, { container }) => {
    if (!id) return
    const svc: any = container.resolve(FILTER_CATEGORY_MODULE)
    await svc.deleteFilterCategories(id)
  }
)

export const updateFilterCategoryStep = createStep(
  "update-filter-category",
  async (input: UpdateInput, { container }) => {
    const svc: any = container.resolve(FILTER_CATEGORY_MODULE)
    const before = await svc.retrieveFilterCategory(input.id)
    const updated = await svc.updateFilterCategories({
      id: input.id,
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.handle !== undefined ? { handle: input.handle } : {}),
      ...(input.rank !== undefined ? { rank: input.rank } : {}),
      ...(input.tag_ids !== undefined ? { tag_ids: input.tag_ids } : {}),
    })
    return new StepResponse(updated, before)
  },
  async (before, { container }) => {
    if (!before) return
    const svc: any = container.resolve(FILTER_CATEGORY_MODULE)
    await svc.updateFilterCategories({
      id: before.id,
      name: before.name,
      handle: before.handle,
      rank: before.rank,
      tag_ids: before.tag_ids,
    })
  }
)

export const deleteFilterCategoryStep = createStep(
  "delete-filter-category",
  async (input: { id: string }, { container }) => {
    const svc: any = container.resolve(FILTER_CATEGORY_MODULE)
    await svc.deleteFilterCategories(input.id)
    return new StepResponse(input.id)
  }
)

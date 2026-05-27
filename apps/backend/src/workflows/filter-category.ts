import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  createFilterCategoryStep,
  updateFilterCategoryStep,
  deleteFilterCategoryStep,
} from "./steps/filter-category-steps"

export const createFilterCategoryWorkflow = createWorkflow(
  "create-filter-category",
  function (input: {
    name: string
    handle: string
    rank?: number
    tag_ids?: string[]
  }) {
    const category = createFilterCategoryStep(input)
    return new WorkflowResponse(category)
  }
)

export const updateFilterCategoryWorkflow = createWorkflow(
  "update-filter-category",
  function (input: {
    id: string
    name?: string
    handle?: string
    rank?: number
    tag_ids?: string[]
  }) {
    const category = updateFilterCategoryStep(input)
    return new WorkflowResponse(category)
  }
)

export const deleteFilterCategoryWorkflow = createWorkflow(
  "delete-filter-category",
  function (input: { id: string }) {
    const id = deleteFilterCategoryStep(input)
    return new WorkflowResponse(id)
  }
)

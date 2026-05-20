import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  createBrewMethodStep,
  updateBrewMethodStep,
  deleteBrewMethodStep,
} from "./steps/brew-method-steps"

export const createBrewMethodWorkflow = createWorkflow(
  "create-brew-method",
  function (input: {
    slug: string
    name: string
    method_label?: string | null
    summary?: string | null
    image_url?: string | null
    param_schema?: unknown
    steps?: unknown
  }) {
    const method = createBrewMethodStep(input)
    return new WorkflowResponse(method)
  }
)

export const updateBrewMethodWorkflow = createWorkflow(
  "update-brew-method",
  function (input: {
    id: string
    slug?: string
    name?: string
    method_label?: string | null
    summary?: string | null
    image_url?: string | null
    param_schema?: unknown
    steps?: unknown
  }) {
    const method = updateBrewMethodStep(input)
    return new WorkflowResponse(method)
  }
)

export const deleteBrewMethodWorkflow = createWorkflow(
  "delete-brew-method",
  function (input: { id: string }) {
    const id = deleteBrewMethodStep(input)
    return new WorkflowResponse(id)
  }
)

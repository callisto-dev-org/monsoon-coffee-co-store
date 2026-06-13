import { Modules } from "@medusajs/framework/utils"
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows"
import { EVENT_DETAIL_MODULE } from "../modules/event-detail"
import {
  upsertEventDetailStep,
  deleteEventDetailStep,
  type EventDetailInput,
} from "./steps/event-detail-steps"

export const upsertEventDetailWorkflow = createWorkflow(
  "upsert-event-detail",
  function (input: EventDetailInput & { product_id: string }) {
    const result = upsertEventDetailStep(input)

    // Only create the module link the first time the detail is created.
    const linkData = transform({ result, input }, ({ result, input }) => {
      if (!result.created) return []
      return [
        {
          [Modules.PRODUCT]: { product_id: input.product_id },
          [EVENT_DETAIL_MODULE]: { event_detail_id: result.detail.id },
        },
      ]
    })

    createRemoteLinkStep(linkData)

    return new WorkflowResponse(result.detail)
  }
)

export const deleteEventDetailWorkflow = createWorkflow(
  "delete-event-detail",
  function (input: { product_id: string }) {
    const id = deleteEventDetailStep(input)
    return new WorkflowResponse(id)
  }
)

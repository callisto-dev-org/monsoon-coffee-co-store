import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  upsertEventDetailStep,
  deleteEventDetailStep,
  type EventDetailInput,
} from "./steps/event-detail-steps"
import {
  linkProductEventDetailStep,
  unlinkProductEventDetailStep,
} from "./steps/link-product-event-detail-steps"

export const upsertEventDetailWorkflow = createWorkflow(
  "upsert-event-detail",
  function (input: EventDetailInput & { product_id: string }) {
    const result = upsertEventDetailStep(input)

    // Link is idempotent — runs on every upsert and tolerates an existing
    // (possibly stale) 1:1 link rather than throwing "multiple links".
    const linkInput = transform({ result, input }, ({ result, input }) => ({
      product_id: input.product_id,
      event_detail_id: result.detail.id,
    }))
    linkProductEventDetailStep(linkInput)

    return new WorkflowResponse(result.detail)
  }
)

export const deleteEventDetailWorkflow = createWorkflow(
  "delete-event-detail",
  function (input: { product_id: string }) {
    const id = deleteEventDetailStep(input)

    // Dismiss the link too, so a later re-create doesn't collide with an
    // orphaned 1:1 link.
    const unlinkInput = transform({ id, input }, ({ id, input }) => ({
      product_id: input.product_id,
      event_detail_id: (id as string | null) ?? "",
    }))
    unlinkProductEventDetailStep(unlinkInput)

    return new WorkflowResponse(id)
  }
)

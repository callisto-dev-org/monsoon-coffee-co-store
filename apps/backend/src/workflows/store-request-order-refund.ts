import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { validateCustomerOrderOwnershipStep } from "./steps/validate-customer-order-ownership"

type Input = {
  order_id: string
  customer_id: string
  note?: string
}

export const storeRequestOrderRefundWorkflow = createWorkflow(
  "store-request-order-refund",
  function (input: Input) {
    validateCustomerOrderOwnershipStep(input)

    const eventData = transform({ input }, ({ input }) => ({
      id: input.order_id,
      customer_id: input.customer_id,
      note: input.note,
    }))

    emitEventStep({
      eventName: "order.refund_requested",
      data: eventData,
    })

    return new WorkflowResponse(undefined)
  }
)

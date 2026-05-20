import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { cancelOrderWorkflow } from "@medusajs/medusa/core-flows"
import { validateCustomerOrderOwnershipStep } from "./steps/validate-customer-order-ownership"

type Input = {
  order_id: string
  customer_id: string
}

export const storeCancelOrderWorkflow = createWorkflow(
  "store-cancel-order",
  function (input: Input) {
    validateCustomerOrderOwnershipStep(input)

    const cancelInput = transform({ input }, ({ input }) => ({
      order_id: input.order_id,
      canceled_by: input.customer_id,
    }))

    cancelOrderWorkflow.runAsStep({ input: cancelInput })

    return new WorkflowResponse(undefined)
  }
)

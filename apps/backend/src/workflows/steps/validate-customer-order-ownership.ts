import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

type Input = {
  order_id: string
  customer_id: string
}

export const validateCustomerOrderOwnershipStep = createStep(
  "validate-customer-order-ownership",
  async ({ order_id, customer_id }: Input, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const { data } = await query.graph({
      entity: "order",
      fields: ["id", "customer_id"],
      filters: { id: order_id },
    })

    const order = data?.[0]

    if (!order) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Order not found")
    }

    if (order.customer_id !== customer_id) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "You don't have permission to modify this order"
      )
    }

    return new StepResponse(order)
  }
)

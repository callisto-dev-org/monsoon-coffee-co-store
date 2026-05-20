import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { storeCancelOrderWorkflow } from "../../../../../workflows/store-cancel-order"

export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params

  await storeCancelOrderWorkflow(req.scope).run({
    input: {
      order_id: id,
      customer_id: req.auth_context.actor_id,
    },
  })

  res.status(200).json({ success: true })
}

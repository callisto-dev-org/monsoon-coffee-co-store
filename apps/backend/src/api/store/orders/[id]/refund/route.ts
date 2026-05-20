import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { storeRequestOrderRefundWorkflow } from "../../../../../workflows/store-request-order-refund"

export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params
  const note = (req.body as { note?: string } | undefined)?.note

  await storeRequestOrderRefundWorkflow(req.scope).run({
    input: {
      order_id: id,
      customer_id: req.auth_context.actor_id,
      note,
    },
  })

  res.status(200).json({ success: true })
}

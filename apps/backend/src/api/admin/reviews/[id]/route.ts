import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { deleteReviewWorkflow } from "../../../../workflows/review"

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const id = req.params.id
  await deleteReviewWorkflow(req.scope).run({ input: { id } })
  res.json({ id, deleted: true })
}

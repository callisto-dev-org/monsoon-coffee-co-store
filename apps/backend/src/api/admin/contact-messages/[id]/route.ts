import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CONTACT_MODULE } from "../../../../modules/contact"
import type { UpdateContactMessageSchema } from "../middlewares"

// Admin: update a message's triage status (new / read / archived).
export async function POST(
  req: AuthenticatedMedusaRequest<UpdateContactMessageSchema>,
  res: MedusaResponse
) {
  const svc: any = req.scope.resolve(CONTACT_MODULE)
  const updated = await svc.updateContactMessages({
    id: req.params.id,
    status: req.validatedBody.status,
  })
  res.json({ contact_message: updated })
}

// Admin: delete a message.
export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const svc: any = req.scope.resolve(CONTACT_MODULE)
  await svc.deleteContactMessages(req.params.id)
  res.json({ id: req.params.id, object: "contact_message", deleted: true })
}

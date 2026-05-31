import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CONTACT_MODULE } from "../../../../modules/contact"

// Admin: remove a newsletter subscriber.
export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const svc: any = req.scope.resolve(CONTACT_MODULE)
  await svc.deleteNewsletterSubscribers(req.params.id)
  res.json({
    id: req.params.id,
    object: "newsletter_subscriber",
    deleted: true,
  })
}

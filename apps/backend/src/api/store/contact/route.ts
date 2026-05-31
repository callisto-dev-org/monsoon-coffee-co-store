import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { CONTACT_MODULE } from "../../../modules/contact"
import type { ContactMessageSchema } from "./middlewares"

// Public: a storefront visitor submits the "Contact Us" form. Validation is
// handled by validateAndTransformBody in middlewares.ts, so the body is trusted
// here. Store routes are gated by the publishable API key automatically.
export async function POST(
  req: MedusaRequest<ContactMessageSchema>,
  res: MedusaResponse
) {
  const svc: any = req.scope.resolve(CONTACT_MODULE)
  const { name, email, subject, message } = req.validatedBody

  const created = await svc.createContactMessages({
    name,
    email,
    subject: subject || null,
    message,
    status: "new",
  })

  // Fire-and-forget: the contact-created subscriber emails the store owner.
  const eventBus = req.scope.resolve(Modules.EVENT_BUS)
  await eventBus.emit({ name: "contact.created", data: { id: created.id } })

  res.status(201).json({ ok: true, id: created.id })
}

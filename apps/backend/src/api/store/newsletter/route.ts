import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { CONTACT_MODULE } from "../../../modules/contact"
import type { NewsletterSchema } from "./middlewares"

// Public: idempotent newsletter signup. Re-subscribing an existing email just
// re-activates it instead of erroring on the unique constraint.
export async function POST(
  req: MedusaRequest<NewsletterSchema>,
  res: MedusaResponse
) {
  const svc: any = req.scope.resolve(CONTACT_MODULE)
  const email = req.validatedBody.email.toLowerCase()

  const existing = await svc.listNewsletterSubscribers({ email })
  if (existing.length) {
    if (existing[0].status !== "subscribed") {
      await svc.updateNewsletterSubscribers({
        id: existing[0].id,
        status: "subscribed",
      })
    }
    return res.status(200).json({ ok: true, alreadySubscribed: true })
  }

  const created = await svc.createNewsletterSubscribers({
    email,
    status: "subscribed",
  })

  const eventBus = req.scope.resolve(Modules.EVENT_BUS)
  await eventBus.emit({
    name: "newsletter.subscribed",
    data: { id: created.id, email },
  })

  res.status(201).json({ ok: true, id: created.id })
}

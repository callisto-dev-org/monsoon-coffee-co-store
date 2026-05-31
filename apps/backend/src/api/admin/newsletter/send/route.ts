import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import { CONTACT_MODULE } from "../../../../modules/contact"
import { renderNewsletter, unsubscribeUrl } from "../../../../modules/contact/lib"
import type { SendNewsletterSchema } from "../middlewares"

const BATCH_SIZE = 25

// Admin: send a newsletter blast to every subscribed address. The body is
// authored in Markdown; we render it to branded HTML + a plain-text fallback,
// and stamp a per-recipient unsubscribe link into each email.
export async function POST(
  req: AuthenticatedMedusaRequest<SendNewsletterSchema>,
  res: MedusaResponse
) {
  const { subject, body } = req.validatedBody
  const svc: any = req.scope.resolve(CONTACT_MODULE)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
  const notificationService = req.scope.resolve(Modules.NOTIFICATION)

  // Recipients = currently-subscribed addresses.
  const { data: subscribers } = await query.graph({
    entity: "newsletter_subscriber",
    fields: ["id", "email", "status"],
    filters: { status: "subscribed" },
    pagination: { take: 10000 },
  })

  if (!subscribers.length) {
    return res
      .status(400)
      .json({ ok: false, message: "No active subscribers to send to." })
  }

  // Log the campaign up front so it's auditable even if delivery partially fails.
  const campaign = await svc.createNewsletterCampaigns({
    subject,
    body_markdown: body,
    recipients: subscribers.length,
    status: "sending",
  })

  const baseUrl = `${req.protocol}://${req.get("host")}`
  let sent = 0
  let failed = 0

  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const chunk = subscribers.slice(i, i + BATCH_SIZE)
    const results = await Promise.allSettled(
      chunk.map((s: { email: string }) => {
        const unsub = unsubscribeUrl(baseUrl, s.email)
        const { html, text } = renderNewsletter(body, {
          subject,
          unsubscribeUrl: unsub,
        })
        return notificationService.createNotifications({
          to: s.email,
          channel: "email",
          // SendGrid: create a dynamic template with this id rendering {{{html}}}.
          // The local provider just logs the payload.
          template: "newsletter-campaign",
          data: { subject, html, text, unsubscribe_url: unsub },
        })
      })
    )
    results.forEach((r) => (r.status === "fulfilled" ? sent++ : failed++))
  }

  const status = failed === 0 ? "sent" : sent === 0 ? "failed" : "partial"
  await svc.updateNewsletterCampaigns({
    id: campaign.id,
    sent,
    failed,
    status,
    error: failed ? `${failed} message(s) failed to send.` : null,
  })

  logger.info(
    `newsletter campaign ${campaign.id}: sent ${sent}, failed ${failed} of ${subscribers.length}`
  )

  res.json({
    ok: true,
    campaign: { ...campaign, sent, failed, status },
  })
}

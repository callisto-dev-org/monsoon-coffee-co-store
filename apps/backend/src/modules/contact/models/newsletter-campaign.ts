import { model } from "@medusajs/framework/utils"

// A newsletter blast sent from the admin. One row per send, kept for history
// and auditing (who got what, when, and how delivery went).
const NewsletterCampaign = model.define("newsletter_campaign", {
  id: model.id().primaryKey(),
  subject: model.text(),
  // Markdown source as authored in the admin compose box.
  body_markdown: model.text(),
  // Number of subscribers targeted at send time.
  recipients: model.number().default(0),
  sent: model.number().default(0),
  failed: model.number().default(0),
  status: model
    .enum(["sending", "sent", "partial", "failed"])
    .default("sending"),
  error: model.text().nullable(),
})

export default NewsletterCampaign

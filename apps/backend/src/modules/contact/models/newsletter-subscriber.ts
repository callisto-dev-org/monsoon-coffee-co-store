import { model } from "@medusajs/framework/utils"

// A storefront newsletter signup. Email is unique so re-subscribing is an
// idempotent upsert rather than a duplicate row.
const NewsletterSubscriber = model.define("newsletter_subscriber", {
  id: model.id().primaryKey(),
  email: model.text().unique(),
  status: model.enum(["subscribed", "unsubscribed"]).default("subscribed"),
})

export default NewsletterSubscriber

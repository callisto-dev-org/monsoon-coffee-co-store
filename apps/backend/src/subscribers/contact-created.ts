import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"

// Emails the store owner whenever a storefront "Contact Us" message comes in.
// Recipient is configured via STORE_OWNER_EMAIL. Delivery goes through the
// notification module's "email" channel — SendGrid if configured, otherwise the
// local provider logs the payload to the backend console.
export default async function contactCreated({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const recipient = process.env.STORE_OWNER_EMAIL

  if (!recipient) {
    logger.warn(
      "contact-created: STORE_OWNER_EMAIL not set; skipping owner email."
    )
    return
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: messages } = await query.graph({
    entity: "contact_message",
    fields: ["id", "name", "email", "subject", "message", "created_at"],
    filters: { id: event.data.id },
  })
  const msg = messages[0]
  if (!msg) return

  const notificationService = container.resolve(Modules.NOTIFICATION)
  try {
    await notificationService.createNotifications({
      to: recipient,
      channel: "email",
      // For SendGrid, create a dynamic template with this id; the local
      // provider ignores it and just logs `data`.
      template: "contact-admin-notification",
      data: {
        name: msg.name,
        email: msg.email,
        subject: msg.subject || "(no subject)",
        message: msg.message,
        submitted_at: msg.created_at,
        // Plain-text fallback some providers surface directly.
        subject_line: `New contact message from ${msg.name}`,
        text: `From: ${msg.name} <${msg.email}>\nSubject: ${
          msg.subject || "(no subject)"
        }\n\n${msg.message}`,
      },
    })
  } catch (e) {
    logger.error(
      `contact-created: failed to send owner email — ${(e as Error).message}`
    )
  }
}

export const config: SubscriberConfig = {
  event: "contact.created",
}

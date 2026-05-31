import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"

// Notifies the store owner of a new newsletter signup. Same delivery rules as
// the contact subscriber: STORE_OWNER_EMAIL + the notification "email" channel.
export default async function newsletterSubscribed({
  event,
  container,
}: SubscriberArgs<{ id: string; email: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const recipient = process.env.STORE_OWNER_EMAIL
  if (!recipient) return

  const notificationService = container.resolve(Modules.NOTIFICATION)
  try {
    await notificationService.createNotifications({
      to: recipient,
      channel: "email",
      template: "newsletter-admin-notification",
      data: {
        email: event.data.email,
        subject_line: "New newsletter subscriber",
        text: `New subscriber: ${event.data.email}`,
      },
    })
  } catch (e) {
    logger.error(
      `newsletter-subscribed: failed to send owner email — ${
        (e as Error).message
      }`
    )
  }
}

export const config: SubscriberConfig = {
  event: "newsletter.subscribed",
}

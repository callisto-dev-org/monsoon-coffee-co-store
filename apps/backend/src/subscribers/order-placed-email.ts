import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"

// Sends an order-confirmation email to the purchaser whenever an order is
// placed. Works for guest orders too — guest orders still carry `order.email`
// (no customer record needed). Delivery goes through the notification module's
// "email" channel (the SMTP provider). Wrapped so a mail failure never breaks
// order placement.
export default async function orderPlacedEmail({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const orderId = event.data?.id
  if (!orderId) return

  try {
    const { data } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "email",
        "currency_code",
        "total",
        "items.title",
        "items.quantity",
        "items.unit_price",
        "shipping_address.first_name",
        "shipping_address.last_name",
        "shipping_address.address_1",
        "shipping_address.city",
        "shipping_address.postal_code",
        "shipping_address.country_code",
      ],
      filters: { id: orderId },
      pagination: { take: 1 },
    })
    const order = data?.[0] as
      | {
          id: string
          display_id?: number | string
          email?: string | null
          currency_code?: string
          total?: number
          items?: Array<{
            title?: string
            quantity?: number
            unit_price?: number
          }>
          shipping_address?: Record<string, unknown> | null
        }
      | undefined

    if (!order?.email) {
      logger.warn(
        `order-placed-email: order ${orderId} has no email; skipping.`
      )
      return
    }

    const storefrontUrl = (process.env.STOREFRONT_URL ?? "").replace(/\/$/, "")
    const countryCode =
      (order.shipping_address?.country_code as string | undefined)?.toLowerCase() ??
      "in"

    const notificationService = container.resolve(Modules.NOTIFICATION)
    await notificationService.createNotifications({
      to: order.email,
      channel: "email",
      template: "order-placed",
      data: {
        display_id: order.display_id,
        currency_code: order.currency_code,
        total: order.total,
        items: (order.items ?? []).map((i) => ({
          title: i.title,
          quantity: i.quantity,
          unit_price: i.unit_price,
        })),
        shipping_address: order.shipping_address,
        order_url: storefrontUrl
          ? `${storefrontUrl}/${countryCode}/account/orders/details/${order.id}`
          : "",
        subject: `Order confirmed — #${order.display_id}`,
      },
    })
    logger.info(`order-placed-email: sent confirmation for order ${orderId}.`)
  } catch (e) {
    logger.error(
      `order-placed-email: failed to send confirmation for order ${orderId} — ${
        (e as Error).message
      }`
    )
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}

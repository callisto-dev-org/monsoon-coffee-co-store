import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"

import { renderReceiptPdf } from "../modules/smtp-notification/receipt-pdf"
import {
  mapOrderToReceiptData,
  receiptItemsReady,
  RECEIPT_RELATIONS,
  type ReceiptOrder,
} from "../modules/smtp-notification/receipt-data"

// Sends an order-confirmation email to the purchaser whenever an order is
// placed. Works for guest orders too — guest orders still carry `order.email`
// (no customer record needed). Delivery goes through the notification module's
// "email" channel (the SMTP provider). Wrapped so a mail failure never breaks
// order placement.
//
// Data is sourced via the Order module service (items + `summary` total) and the
// shared receipt builder, so the email's HTML invoice, the attached PDF, and the
// order-page PDF download all show identical numbers. See `receipt-data.ts`.
export default async function orderPlacedEmail({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const orderModule = container.resolve(Modules.ORDER) as {
    retrieveOrder: (
      id: string,
      config?: { relations?: string[] }
    ) => Promise<ReceiptOrder>
  }
  const orderId = event.data?.id
  if (!orderId) return

  try {
    const fetchOrder = async (): Promise<ReceiptOrder | undefined> => {
      try {
        return await orderModule.retrieveOrder(orderId, {
          relations: RECEIPT_RELATIONS,
        })
      } catch {
        return undefined
      }
    }

    // The `order.placed` event can fire before the line items' quantity/price are
    // visible to a fresh read, so the first read may return zeros. Poll with
    // backoff until the items are populated, then build from that snapshot.
    let order = await fetchOrder()
    const backoffsMs = [300, 600, 1000, 1500, 2500]
    for (
      let attempt = 0;
      attempt < backoffsMs.length && !receiptItemsReady(order);
      attempt++
    ) {
      await new Promise((resolve) => setTimeout(resolve, backoffsMs[attempt]))
      order = await fetchOrder()
    }
    if (!receiptItemsReady(order)) {
      logger.warn(
        `order-placed-email: order ${orderId} line items still not fully ` +
          `populated after retries; sending best-effort invoice.`
      )
    }

    if (!order?.email) {
      logger.warn(
        `order-placed-email: order ${orderId} has no email; skipping.`
      )
      return
    }

    const receipt = mapOrderToReceiptData(order)

    const storefrontUrl = (process.env.STOREFRONT_URL ?? "").replace(/\/$/, "")
    const countryCode =
      (order.shipping_address?.country_code as string | undefined)?.toLowerCase() ??
      "in"

    // Branded PDF receipt — the exact same artifact the order page serves.
    let attachments:
      | Array<{
          filename: string
          content: string
          content_type: string
          disposition: string
        }>
      | undefined
    try {
      const pdf = await renderReceiptPdf(receipt)
      attachments = [
        {
          filename: `monsoon-receipt-${order.display_id ?? order.id}.pdf`,
          content: pdf.toString("base64"),
          content_type: "application/pdf",
          disposition: "attachment",
        },
      ]
    } catch (pdfErr) {
      logger.warn(
        `order-placed-email: receipt PDF failed for order ${orderId} — ${
          (pdfErr as Error).message
        }`
      )
    }

    const notificationService = container.resolve(Modules.NOTIFICATION)
    await notificationService.createNotifications({
      to: order.email,
      channel: "email",
      template: "order-placed",
      attachments,
      data: {
        display_id: order.display_id,
        currency_code: order.currency_code,
        total: receipt.total,
        items: receipt.items,
        shipping_address: order.shipping_address,
        // Public confirmation page so the link works for guests too (the
        // account order page is login-gated).
        order_url: storefrontUrl
          ? `${storefrontUrl}/${countryCode}/order/${order.id}/confirmed`
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

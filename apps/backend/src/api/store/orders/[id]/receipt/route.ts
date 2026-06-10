import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

import { renderReceiptPdf } from "../../../../../modules/smtp-notification/receipt-pdf"
import { buildOrderReceipt } from "../../../../../modules/smtp-notification/receipt-data"

// GET /store/orders/:id/receipt — returns the branded PDF receipt for an order.
// Same generator + data builder the order-confirmation email uses, so the
// downloaded PDF is identical to the emailed attachment. Reachable with the
// storefront publishable key (works for guest orders too); the order id acts as
// the capability token, matching the existing public order-confirmation page.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const orderModule = req.scope.resolve(Modules.ORDER)

  const receipt = await buildOrderReceipt(orderModule as never, id)
  if (!receipt) {
    res.status(404).json({ message: "Order not found" })
    return
  }

  const pdf = await renderReceiptPdf(receipt)
  res.setHeader("Content-Type", "application/pdf")
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="monsoon-receipt-${receipt.display_id ?? id}.pdf"`
  )
  res.setHeader("Content-Length", String(pdf.length))
  res.send(pdf)
}

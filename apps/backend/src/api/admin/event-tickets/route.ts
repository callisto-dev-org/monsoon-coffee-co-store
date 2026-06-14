import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { EVENT_TICKET_MODULE } from "../../../modules/event-ticket"
import { normalizeTicketCode } from "../../../modules/event-ticket/normalize"

const TICKET_FIELDS = [
  "id",
  "code",
  "order_id",
  "order_display_id",
  "line_item_id",
  "product_id",
  "event_title",
  "email",
  "status",
  "checked_in_at",
  "checked_in_by",
  "created_at",
]

// GET /admin/event-tickets               → list recent tickets
// GET /admin/event-tickets?code=MC-EVT-… → look up a single ticket (verify, no
//                                          mutation). Accepts a scanned QR URL.
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const service = req.scope.resolve(EVENT_TICKET_MODULE) as {
    listEventTickets: (
      filters?: Record<string, unknown>,
      config?: Record<string, unknown>
    ) => Promise<unknown[]>
  }

  const rawCode = req.query.code
  if (rawCode != null && String(rawCode).length) {
    const code = normalizeTicketCode(rawCode)
    const tickets = await service.listEventTickets(
      { code },
      { select: TICKET_FIELDS }
    )
    const ticket = (tickets as Array<{ code?: string }>)[0] ?? null
    return res.json({ ticket, found: !!ticket, code })
  }

  const productId = req.query.product_id
  const filters = productId ? { product_id: String(productId) } : {}
  const tickets = await service.listEventTickets(filters, {
    select: TICKET_FIELDS,
    take: 200,
    order: { created_at: "DESC" },
  })
  res.json({ tickets, count: tickets.length })
}

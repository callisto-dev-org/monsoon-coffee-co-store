import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { EVENT_TICKET_MODULE } from "../../../../modules/event-ticket"

type TicketRow = { id: string; status: "valid" | "checked_in" | "void" }

type TicketService = {
  listEventTickets: (
    filters?: Record<string, unknown>,
    config?: Record<string, unknown>
  ) => Promise<TicketRow[]>
  updateEventTickets: (data: Record<string, unknown>) => Promise<unknown>
}

// POST /admin/event-tickets/void-all   body: { product_id }
// "Reset event" — voids every ticket for an event so the door list starts
// fresh. Already-void tickets are left untouched. Idempotent. Voiding (rather
// than deleting) keeps an audit trail and means a re-issued/re-scanned code
// reads as "void" instead of "not found".
export async function POST(
  req: AuthenticatedMedusaRequest<{ product_id?: string }>,
  res: MedusaResponse
) {
  const service = req.scope.resolve(EVENT_TICKET_MODULE) as TicketService
  const productId = req.body?.product_id
  if (!productId) {
    return res
      .status(400)
      .json({ result: "invalid", message: "Missing product_id." })
  }

  const tickets = await service.listEventTickets(
    { product_id: String(productId) },
    { select: ["id", "status"], take: 1000 }
  )
  const toVoid = tickets.filter((t) => t.status !== "void")

  for (const t of toVoid) {
    await service.updateEventTickets({ id: t.id, status: "void" })
  }

  res.json({
    result: "reset",
    product_id: productId,
    total: tickets.length,
    voided: toVoid.length,
  })
}

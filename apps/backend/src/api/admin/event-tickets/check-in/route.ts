import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { EVENT_TICKET_MODULE } from "../../../../modules/event-ticket"
import { normalizeTicketCode } from "../../../../modules/event-ticket/normalize"

type TicketRow = {
  id: string
  code: string
  status: "valid" | "checked_in" | "void"
  checked_in_at?: string | Date | null
  checked_in_by?: string | null
  event_title?: string | null
  order_display_id?: string | null
}

type TicketService = {
  listEventTickets: (
    filters?: Record<string, unknown>,
    config?: Record<string, unknown>
  ) => Promise<TicketRow[]>
  updateEventTickets: (data: Record<string, unknown>) => Promise<unknown>
}

// POST /admin/event-tickets/check-in   body: { code }
// Marks a valid ticket as checked-in. Idempotent + safe at the door:
//   - not found        → { result: "not_found" }
//   - already used     → { result: "already_checked_in", ticket }  (warns staff)
//   - void/revoked     → { result: "void", ticket }
//   - first valid scan → { result: "checked_in", ticket }
export async function POST(
  req: AuthenticatedMedusaRequest<{ code?: string }>,
  res: MedusaResponse
) {
  const service = req.scope.resolve(EVENT_TICKET_MODULE) as TicketService
  const code = normalizeTicketCode(req.body?.code ?? req.query?.code)
  if (!code) {
    return res.status(400).json({ result: "invalid", message: "Missing code." })
  }

  const [ticket] = await service.listEventTickets({ code })
  if (!ticket) {
    return res.json({ result: "not_found", code, ticket: null })
  }
  if (ticket.status === "void") {
    return res.json({ result: "void", ticket })
  }
  if (ticket.status === "checked_in") {
    return res.json({ result: "already_checked_in", ticket })
  }

  const by =
    (req.auth_context?.actor_id as string | undefined) ?? "admin"
  await service.updateEventTickets({
    id: ticket.id,
    status: "checked_in",
    checked_in_at: new Date(),
    checked_in_by: by,
  })

  const [updated] = await service.listEventTickets({ code })
  res.json({ result: "checked_in", ticket: updated ?? ticket })
}

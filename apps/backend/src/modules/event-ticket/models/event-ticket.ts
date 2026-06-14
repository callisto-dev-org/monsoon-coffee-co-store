import { model } from "@medusajs/framework/utils"

// A single admit-one event ticket — the source of truth for door verification.
// One row per unit purchased (qty 2 → 2 rows). Minted on order.placed by the
// order-placed-tickets subscriber; verified/checked-in at the door via the admin
// "Ticket Check-in" page. The `code` is what's printed + encoded in the QR.
const EventTicket = model
  .define("event_ticket", {
    id: model.id().primaryKey(),

    // Human/scannable code, e.g. "MC-EVT-1042-9F3A1B7C42". Unique = the ticket.
    code: model.text().unique(),

    // Where it came from (kept denormalized so the door screen needs no joins).
    order_id: model.text(),
    order_display_id: model.text().nullable(),
    line_item_id: model.text().nullable(),
    product_id: model.text().nullable(),
    event_title: model.text().nullable(),
    email: model.text().nullable(),

    // Lifecycle. "valid" = admit, "checked_in" = already used, "void" = revoked.
    status: model
      .enum(["valid", "checked_in", "void"])
      .default("valid"),

    // Audit of the check-in.
    checked_in_at: model.dateTime().nullable(),
    checked_in_by: model.text().nullable(),
  })
  .indexes([{ on: ["product_id"] }, { on: ["order_id"] }])

export default EventTicket

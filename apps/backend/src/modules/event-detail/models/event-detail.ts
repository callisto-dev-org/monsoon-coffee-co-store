import { model } from "@medusajs/framework/utils"

// Per-product event sheet — workshops, tastings, collabs sold as products.
// Linked 1:1 to a Medusa product via src/links/event-detail-product.ts.
// `product_id` is mirrored here for fast lookups without joining the link table.
// Mirrors the coffee-profile pattern (per-product extension data).
const EventDetail = model.define("event_detail", {
  id: model.id().primaryKey(),
  product_id: model.text().unique(),

  // Collaborator/partner for the event, e.g. "Brun Coffee".
  partner: model.text().nullable(),

  // Where it happens. `venue` + `city`, e.g. "Vinyl & Brew" / "Chennai".
  venue: model.text().nullable(),
  city: model.text().nullable(),

  // Human date label as written, e.g. "Sunday, July 5th". `event_date` is an
  // optional structured timestamp for sorting / calendars.
  date_label: model.text().nullable(),
  event_date: model.dateTime().nullable(),

  // Capacity, e.g. 25 ("Limited to 25 seats").
  seats_total: model.number().nullable(),

  // Long intro / overview paragraph. Stored as Markdown.
  description: model.text().nullable(),

  // "What's in store" — ordered list of bullet strings.
  highlights: model.json().nullable(),

})

export default EventDetail

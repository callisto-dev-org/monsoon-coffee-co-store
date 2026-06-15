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

  // Schedule as 24h "HH:MM" strings. `end_time` is optional — an event may
  // have a start time only. When both are set the storefront shows a range
  // and derives the duration.
  start_time: model.text().nullable(),
  end_time: model.text().nullable(),

  // Capacity, e.g. 25 ("Limited to 25 seats").
  seats_total: model.number().nullable(),

  // When true, booking is stopped: the storefront keeps the event page visible
  // but disables the buy button and shows a "Booking Closed" state. Toggled
  // from the Events admin without taking the product offline.
  booking_closed: model.boolean().default(false),

  // Long intro / overview paragraph. Stored as Markdown.
  description: model.text().nullable(),

  // "What's in store" — ordered list of bullet strings.
  highlights: model.json().nullable(),

  // Gallery image URLs (uploaded via the admin file module).
  images: model.json().nullable(),
})

export default EventDetail

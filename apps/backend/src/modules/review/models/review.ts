import { model } from "@medusajs/framework/utils"

// Customer review for a product. customer_id and product_id are mirrored on
// the row for fast lookups; the link to the product is created in
// src/links/review-product.ts so query.graph can traverse product → reviews.
const Review = model.define("review", {
  id: model.id().primaryKey(),
  product_id: model.text().index(),
  customer_id: model.text().index().nullable(),
  // Snapshot of the reviewer's display name at write-time — keeps the review
  // intact if the customer is later renamed or deleted.
  customer_name: model.text().nullable(),
  // The variant the customer says they bought. variant_id mirrors the
  // Medusa variant ID for joins; variant_title is a snapshot so the chip
  // keeps reading correctly even if the variant is later renamed or deleted.
  variant_id: model.text().index().nullable(),
  variant_title: model.text().nullable(),
  rating: model.number(), // 1 – 5
  title: model.text().nullable(),
  body: model.text(),
  // Optional ordered list of image URLs uploaded with this review.
  // Stored as a JSON string[] so we don't need a separate table for an MVP.
  images: model.json().nullable(),
  // Default published so reviews appear immediately. Switch to "pending" if
  // moderation is added later.
  status: model
    .enum(["pending", "published", "rejected"])
    .default("published"),
})

export default Review

import { model } from "@medusajs/framework/utils"

// A message submitted through the storefront "Contact Us" form. Kept simple —
// no links to other modules; admins read these from the contact module.
const ContactMessage = model.define("contact_message", {
  id: model.id().primaryKey(),
  name: model.text(),
  email: model.text().index(),
  subject: model.text().nullable(),
  message: model.text(),
  // Lightweight triage state for whoever reads the inbox.
  status: model.enum(["new", "read", "archived"]).default("new"),
})

export default ContactMessage

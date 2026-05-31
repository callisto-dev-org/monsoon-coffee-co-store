import { MedusaService } from "@medusajs/framework/utils"
import ContactMessage from "./models/contact-message"
import NewsletterSubscriber from "./models/newsletter-subscriber"
import NewsletterCampaign from "./models/newsletter-campaign"

class ContactModuleService extends MedusaService({
  ContactMessage,
  NewsletterSubscriber,
  NewsletterCampaign,
}) {}

export default ContactModuleService

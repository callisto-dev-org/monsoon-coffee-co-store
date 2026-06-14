import { MedusaService } from "@medusajs/framework/utils"
import EventTicket from "./models/event-ticket"

class EventTicketModuleService extends MedusaService({
  EventTicket,
}) {}

export default EventTicketModuleService

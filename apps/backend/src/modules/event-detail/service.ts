import { MedusaService } from "@medusajs/framework/utils"
import EventDetail from "./models/event-detail"

class EventDetailModuleService extends MedusaService({
  EventDetail,
}) {}

export default EventDetailModuleService

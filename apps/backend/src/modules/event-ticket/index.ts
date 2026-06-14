import { Module } from "@medusajs/framework/utils"
import EventTicketModuleService from "./service"

export const EVENT_TICKET_MODULE = "event_ticket"

export default Module(EVENT_TICKET_MODULE, {
  service: EventTicketModuleService,
})

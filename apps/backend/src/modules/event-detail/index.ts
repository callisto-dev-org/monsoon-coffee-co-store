import { Module } from "@medusajs/framework/utils"
import EventDetailModuleService from "./service"

export const EVENT_DETAIL_MODULE = "event_detail"

export default Module(EVENT_DETAIL_MODULE, {
  service: EventDetailModuleService,
})

import { Module } from "@medusajs/framework/utils"
import CoffeeProfileModuleService from "./service"

export const COFFEE_PROFILE_MODULE = "coffee_profile"

export default Module(COFFEE_PROFILE_MODULE, {
  service: CoffeeProfileModuleService,
})

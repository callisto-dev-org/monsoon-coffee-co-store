import { Module } from "@medusajs/framework/utils"
import BrewModuleService from "./service"

export const BREW_MODULE = "brew"

export default Module(BREW_MODULE, {
  service: BrewModuleService,
})

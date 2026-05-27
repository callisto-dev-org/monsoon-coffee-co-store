import { Module } from "@medusajs/framework/utils"
import FilterCategoryService from "./service"

export const FILTER_CATEGORY_MODULE = "filter_category"

export default Module(FILTER_CATEGORY_MODULE, {
  service: FilterCategoryService,
})

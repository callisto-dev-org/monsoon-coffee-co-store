import {
  MiddlewareRoute,
  validateAndTransformBody,
} from "@medusajs/framework"
import { z } from "zod"

export const UpdateBrewSettingsSchema = z.object({
  enabled_product_type_ids: z.array(z.string().min(1)).nullable().optional(),
})
export type UpdateBrewSettingsSchema = z.infer<typeof UpdateBrewSettingsSchema>

export const brewSettingsMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/brew-settings",
    method: "POST",
    middlewares: [validateAndTransformBody(UpdateBrewSettingsSchema)],
  },
]

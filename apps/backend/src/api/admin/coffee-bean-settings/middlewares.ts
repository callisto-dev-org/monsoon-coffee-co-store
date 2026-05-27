import {
  MiddlewareRoute,
  validateAndTransformBody,
} from "@medusajs/framework"
import { z } from "zod"

const LabelKindSchema = z.enum(["single", "multi", "text", "number"])

const LabelCategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: LabelKindSchema,
  values: z.array(z.string().min(1)),
})

export const UpdateCoffeeBeanSettingsSchema = z.object({
  label_categories: z.array(LabelCategorySchema),
})
export type UpdateCoffeeBeanSettingsSchema = z.infer<
  typeof UpdateCoffeeBeanSettingsSchema
>

export const coffeeBeanSettingsMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/coffee-bean-settings",
    method: "POST",
    middlewares: [validateAndTransformBody(UpdateCoffeeBeanSettingsSchema)],
  },
]

import {
  MiddlewareRoute,
  validateAndTransformBody,
} from "@medusajs/framework"
import { z } from "zod"

export const CreateFilterCategorySchema = z.object({
  name: z.string().min(1),
  handle: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "lowercase, dashes only"),
  rank: z.number().int().nonnegative().optional(),
  tag_ids: z.array(z.string()).optional(),
})
export type CreateFilterCategorySchema = z.infer<typeof CreateFilterCategorySchema>

export const UpdateFilterCategorySchema = CreateFilterCategorySchema.partial()
export type UpdateFilterCategorySchema = z.infer<typeof UpdateFilterCategorySchema>

export const filterCategoryMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/filter-categories",
    method: "POST",
    middlewares: [validateAndTransformBody(CreateFilterCategorySchema)],
  },
  {
    matcher: "/admin/filter-categories/:id",
    method: "POST",
    middlewares: [validateAndTransformBody(UpdateFilterCategorySchema)],
  },
]

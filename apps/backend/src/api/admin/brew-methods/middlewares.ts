import {
  MiddlewareRoute,
  validateAndTransformBody,
} from "@medusajs/framework"
import { z } from "zod"

const ParamSchemaItem = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  unit: z.string().optional(),
})

const StepItem = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
})

export const CreateBrewMethodSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "lowercase, dashes only"),
  name: z.string().min(1),
  method_label: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  image_url: z.string().url().optional().nullable(),
  param_schema: z.array(ParamSchemaItem).optional().nullable(),
  steps: z.array(StepItem).optional().nullable(),
})
export type CreateBrewMethodSchema = z.infer<typeof CreateBrewMethodSchema>

export const UpdateBrewMethodSchema = CreateBrewMethodSchema.partial()
export type UpdateBrewMethodSchema = z.infer<typeof UpdateBrewMethodSchema>

export const brewMethodMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/brew-methods",
    method: "POST",
    middlewares: [validateAndTransformBody(CreateBrewMethodSchema)],
  },
  {
    matcher: "/admin/brew-methods/:id",
    method: "POST",
    middlewares: [validateAndTransformBody(UpdateBrewMethodSchema)],
  },
]

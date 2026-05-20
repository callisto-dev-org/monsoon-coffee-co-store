import {
  MiddlewareRoute,
  validateAndTransformBody,
} from "@medusajs/framework"
import { z } from "zod"

const StepSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
})

export const CreateBrewRecipeSchema = z.object({
  product_id: z.string().min(1),
  brew_method_id: z.string().min(1),
  title: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  params: z.record(z.string(), z.any()).optional().nullable(),
  steps: z.array(StepSchema).optional().nullable(),
})
export type CreateBrewRecipeSchema = z.infer<typeof CreateBrewRecipeSchema>

export const UpdateBrewRecipeSchema = z.object({
  title: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  params: z.record(z.string(), z.any()).optional().nullable(),
  steps: z.array(StepSchema).optional().nullable(),
})
export type UpdateBrewRecipeSchema = z.infer<typeof UpdateBrewRecipeSchema>

export const brewRecipeMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/brew-recipes",
    method: "POST",
    middlewares: [validateAndTransformBody(CreateBrewRecipeSchema)],
  },
  {
    matcher: "/admin/brew-recipes/:id",
    method: "POST",
    middlewares: [validateAndTransformBody(UpdateBrewRecipeSchema)],
  },
]

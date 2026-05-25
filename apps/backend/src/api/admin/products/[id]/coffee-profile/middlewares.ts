import {
  MiddlewareRoute,
  validateAndTransformBody,
} from "@medusajs/framework"
import { z } from "zod"

const ExtractionPointSchema = z.object({
  time_s: z.number().nonnegative(),
  yield_g: z.number().nonnegative(),
  tds: z.number().nonnegative().optional(),
})

export const UpsertCoffeeProfileSchema = z.object({
  origin: z.string().nullable().optional(),
  altitude_m: z.number().int().positive().nullable().optional(),
  varietal: z.string().nullable().optional(),
  process: z.string().nullable().optional(),
  roast_level: z.string().nullable().optional(),
  roast_date: z.string().datetime().nullable().optional(),
  harvest_year: z.number().int().min(1900).max(2100).nullable().optional(),
  recommended_ratio: z.string().nullable().optional(),
  tasting_notes: z.array(z.string()).nullable().optional(),
  extraction_profile: z.array(ExtractionPointSchema).nullable().optional(),
})
export type UpsertCoffeeProfileSchema = z.infer<
  typeof UpsertCoffeeProfileSchema
>

export const coffeeProfileMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/products/:id/coffee-profile",
    method: "POST",
    middlewares: [validateAndTransformBody(UpsertCoffeeProfileSchema)],
  },
]

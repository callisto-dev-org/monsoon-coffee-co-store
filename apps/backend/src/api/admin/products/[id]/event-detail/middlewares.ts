import {
  MiddlewareRoute,
  validateAndTransformBody,
} from "@medusajs/framework"
import { z } from "zod"

export const UpsertEventDetailSchema = z.object({
  partner: z.string().nullable().optional(),
  venue: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  date_label: z.string().nullable().optional(),
  event_date: z.string().datetime().nullable().optional(),
  start_time: z.string().nullable().optional(),
  end_time: z.string().nullable().optional(),
  seats_total: z.number().int().min(0).nullable().optional(),
  booking_closed: z.boolean().optional(),
  description: z.string().nullable().optional(),
  highlights: z.array(z.string()).nullable().optional(),
  images: z.array(z.string()).nullable().optional(),
})
export type UpsertEventDetailSchema = z.infer<typeof UpsertEventDetailSchema>

export const eventDetailMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/products/:id/event-detail",
    method: "POST",
    middlewares: [validateAndTransformBody(UpsertEventDetailSchema)],
  },
]

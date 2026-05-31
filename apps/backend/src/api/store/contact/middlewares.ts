import {
  MiddlewareRoute,
  validateAndTransformBody,
} from "@medusajs/framework"
import { z } from "zod"

export const ContactMessageSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
  subject: z.string().trim().max(200).optional().nullable(),
  message: z.string().trim().min(2).max(4000),
})
export type ContactMessageSchema = z.infer<typeof ContactMessageSchema>

export const contactStoreMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/contact",
    method: "POST",
    middlewares: [validateAndTransformBody(ContactMessageSchema)],
  },
]

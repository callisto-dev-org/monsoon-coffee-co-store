import {
  MiddlewareRoute,
  validateAndTransformBody,
} from "@medusajs/framework"
import { z } from "zod"

export const SendNewsletterSchema = z.object({
  subject: z.string().trim().min(1).max(200),
  // Markdown source.
  body: z.string().trim().min(2).max(50000),
})
export type SendNewsletterSchema = z.infer<typeof SendNewsletterSchema>

export const newsletterAdminMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/newsletter/send",
    method: "POST",
    middlewares: [validateAndTransformBody(SendNewsletterSchema)],
  },
]

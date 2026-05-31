import {
  MiddlewareRoute,
  validateAndTransformBody,
} from "@medusajs/framework"
import { z } from "zod"

export const NewsletterSchema = z.object({
  email: z.string().trim().email(),
})
export type NewsletterSchema = z.infer<typeof NewsletterSchema>

export const newsletterStoreMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/newsletter",
    method: "POST",
    middlewares: [validateAndTransformBody(NewsletterSchema)],
  },
]

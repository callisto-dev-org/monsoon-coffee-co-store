import {
  MiddlewareRoute,
  validateAndTransformBody,
} from "@medusajs/framework"
import { z } from "zod"

export const UpdateContactMessageSchema = z.object({
  status: z.enum(["new", "read", "archived"]),
})
export type UpdateContactMessageSchema = z.infer<
  typeof UpdateContactMessageSchema
>

export const contactMessageAdminMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/contact-messages/:id",
    method: "POST",
    middlewares: [validateAndTransformBody(UpdateContactMessageSchema)],
  },
]

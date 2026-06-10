import {
  MiddlewareRoute,
  validateAndTransformBody,
} from "@medusajs/framework"
import { z } from "zod"

export const SetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .max(100),
  // Email OTP that proves ownership before a password is set/changed.
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code."),
})
export type SetPasswordSchema = z.infer<typeof SetPasswordSchema>

// /store/customers/me/* is authenticated automatically, so these entries only
// add body validation — no `authenticate` middleware needed.
export const customerMeStoreMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/customers/me/set-password",
    method: "POST",
    middlewares: [validateAndTransformBody(SetPasswordSchema)],
  },
]

import {
  MiddlewareRoute,
  validateAndTransformBody,
} from "@medusajs/framework"
import { z } from "zod"

export const SendLoginOtpSchema = z.object({
  email: z.string().trim().email(),
})
export type SendLoginOtpSchema = z.infer<typeof SendLoginOtpSchema>

export const VerifyLoginOtpSchema = z.object({
  email: z.string().trim().email(),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code."),
})
export type VerifyLoginOtpSchema = z.infer<typeof VerifyLoginOtpSchema>

export const authOtpStoreMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/auth-otp/send",
    method: "POST",
    middlewares: [validateAndTransformBody(SendLoginOtpSchema)],
  },
  {
    matcher: "/store/auth-otp/verify",
    method: "POST",
    middlewares: [validateAndTransformBody(VerifyLoginOtpSchema)],
  },
]

import {
  MiddlewareRoute,
  validateAndTransformBody,
} from "@medusajs/framework"
import {
  authenticate,
  type AuthenticatedMedusaRequest,
  type MedusaNextFunction,
  type MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { z } from "zod"

import { isCartEmailVerified } from "./_otp"

export const SendOtpSchema = z.object({
  cart_id: z.string().trim().min(1),
})
export type SendOtpSchema = z.infer<typeof SendOtpSchema>

export const VerifyOtpSchema = z.object({
  cart_id: z.string().trim().min(1),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code."),
})
export type VerifyOtpSchema = z.infer<typeof VerifyOtpSchema>

// Gate on cart completion: a guest (no authenticated customer) may only place
// the order once they've verified the email on the cart. Logged-in customers
// authenticated with a real session/token are treated as already verified.
// This is the server-side enforcement behind the storefront's UI gate.
async function ensureGuestEmailVerified(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  if (req.auth_context?.actor_id) return next()

  const cartId = req.params.id
  if (!cartId) return next()

  try {
    const cartModule = req.scope.resolve(Modules.CART)
    const cart = await cartModule.retrieveCart(cartId, {
      select: ["id", "email", "metadata"],
    })
    if (isCartEmailVerified(cart)) return next()
  } catch {
    // fall through to the rejection below
  }

  res.status(403).json({
    type: "not_allowed",
    message: "Please verify your email before placing the order.",
  })
}

export const guestOtpStoreMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/guest-otp/send",
    method: "POST",
    middlewares: [validateAndTransformBody(SendOtpSchema)],
  },
  {
    matcher: "/store/guest-otp/verify",
    method: "POST",
    middlewares: [validateAndTransformBody(VerifyOtpSchema)],
  },
  {
    matcher: "/store/carts/:id/complete",
    method: "POST",
    middlewares: [
      authenticate("customer", ["session", "bearer"], {
        allowUnauthenticated: true,
      }),
      ensureGuestEmailVerified,
    ],
  },
]

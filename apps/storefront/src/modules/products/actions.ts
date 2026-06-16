"use server"

import { addToCart, deleteLineItem, updateLineItem } from "@lib/data/cart"
import { friendlyError } from "@lib/util/friendly-error"

export type CartActionResult =
  | { ok: true }
  | { ok: false; message: string }

export type AddToCartResult = CartActionResult

// Always surface shopper-friendly copy — never raw Medusa/inventory phrasing.
function toMessage(e: unknown) {
  return friendlyError(e)
}

export async function addToCartAction(input: {
  variantId: string
  quantity: number
  countryCode: string
}): Promise<AddToCartResult> {
  try {
    await addToCart(input)
    return { ok: true }
  } catch (e) {
    return { ok: false, message: toMessage(e) }
  }
}

// Buy Now: add the variant to the cart, then let the CLIENT navigate to
// checkout. We deliberately do NOT redirect() here: this action is awaited
// imperatively inside a click handler, where a thrown NEXT_REDIRECT signal gets
// caught by the caller's try/catch and surfaces as a spurious "Something went
// wrong" flash right before navigation. Returning ok lets the client push to
// checkout cleanly (same pattern as placeRazorpayOrder).
export async function buyNowAction(input: {
  variantId: string
  quantity: number
  countryCode: string
}): Promise<CartActionResult> {
  try {
    await addToCart(input)
    return { ok: true }
  } catch (e) {
    return { ok: false, message: toMessage(e) }
  }
}

export async function updateCartItemQuantityAction(input: {
  lineId: string
  quantity: number
}): Promise<CartActionResult> {
  try {
    if (input.quantity <= 0) {
      await deleteLineItem(input.lineId)
    } else {
      await updateLineItem({ lineId: input.lineId, quantity: input.quantity })
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, message: toMessage(e) }
  }
}

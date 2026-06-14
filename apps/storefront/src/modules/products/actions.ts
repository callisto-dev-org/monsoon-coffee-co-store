"use server"

import { redirect } from "next/navigation"

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

// Buy Now: add the variant, then go straight to checkout. On success this
// redirects (and never returns); it only returns a result when the add fails.
export async function buyNowAction(input: {
  variantId: string
  quantity: number
  countryCode: string
}): Promise<CartActionResult | void> {
  try {
    await addToCart(input)
  } catch (e) {
    return { ok: false, message: toMessage(e) }
  }
  // Outside the try so Next's redirect signal isn't swallowed.
  redirect(`/${input.countryCode}/checkout`)
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

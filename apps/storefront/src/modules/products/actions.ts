"use server"

import { addToCart, deleteLineItem, updateLineItem } from "@lib/data/cart"

export type CartActionResult =
  | { ok: true }
  | { ok: false; message: string }

export type AddToCartResult = CartActionResult

function toMessage(e: unknown) {
  return e instanceof Error
    ? e.message
    : typeof e === "string"
    ? e
    : "We couldn't update your bag. Please try again."
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

"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import {
  getAuthHeaders,
  getCacheOptions,
  getCacheTag,
  getCartId,
  removeCartId,
  setCartId,
} from "./cookies"
import { getRegion } from "./regions"
import { getLocale } from "./locale-actions"

/**
 * Retrieves a cart by its ID. If no ID is provided, it will use the cart ID from the cookies.
 * @param cartId - optional - The ID of the cart to retrieve.
 * @returns The cart object if found, or null if not found.
 */
export async function retrieveCart(
  cartId?: string,
  fields?: string,
  opts?: { noCache?: boolean }
) {
  const id = cartId || (await getCartId())
  fields ??=
    "*items, *region, *items.product, *items.variant, *items.thumbnail, *items.metadata, +items.total, *promotions, +shipping_methods.name, *payment_collection, *payment_collection.payment_sessions, metadata"

  if (!id) {
    return null
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  // The checkout flow mutates the cart (address → shipping → payment session)
  // and then re-reads it within the same render. force-cache memoizes the first
  // read, so later reads miss the mutations and the page lags a render behind.
  // noCache forces a fresh read so each step sees the latest state.
  if (opts?.noCache) {
    return await sdk.client
      .fetch<HttpTypes.StoreCartResponse>(`/store/carts/${id}`, {
        method: "GET",
        query: {
          fields,
        },
        headers,
        cache: "no-store",
      })
      .then(({ cart }: { cart: HttpTypes.StoreCart }) => cart)
      .catch(() => null)
  }

  const next = {
    ...(await getCacheOptions("carts")),
  }

  return await sdk.client
    .fetch<HttpTypes.StoreCartResponse>(`/store/carts/${id}`, {
      method: "GET",
      query: {
        fields,
      },
      headers,
      next,
      cache: "force-cache",
    })
    .then(({ cart }: { cart: HttpTypes.StoreCart }) => cart)
    .catch(() => null)
}

export async function getOrSetCart(countryCode: string) {
  const region = await getRegion(countryCode)

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  let cart = await retrieveCart(undefined, "id,region_id,completed_at")

  const headers = {
    ...(await getAuthHeaders()),
  }

  // A completed cart (order already placed) can't accept new line items. If the
  // cookie still points at one — e.g. the customer paid and the order was
  // created — drop it and create a fresh cart instead of stranding them.
  if (cart?.completed_at) {
    await removeCartId()
    cart = null
  }

  if (!cart) {
    const locale = await getLocale()
    const cartResp = await sdk.store.cart.create(
      { region_id: region.id, locale: locale || undefined },
      {},
      headers
    )
    cart = cartResp.cart

    await setCartId(cart.id)

    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
  }

  if (cart && cart?.region_id !== region.id) {
    await sdk.store.cart.update(cart.id, { region_id: region.id }, {}, headers)
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
  }

  return cart
}

export async function updateCart(data: HttpTypes.StoreUpdateCart) {
  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("No existing cart found, please create one before updating")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.cart
    .update(cartId, data, {}, headers)
    .then(async ({ cart }: { cart: HttpTypes.StoreCart }) => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)

      return cart
    })
    .catch(medusaError)
}

export async function addToCart({
  variantId,
  quantity,
  countryCode,
}: {
  variantId: string
  quantity: number
  countryCode: string
}) {
  if (!variantId) {
    throw new Error("Missing variant ID when adding to cart")
  }

  const cart = await getOrSetCart(countryCode)

  if (!cart) {
    throw new Error("Error retrieving or creating cart")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.cart
    .createLineItem(
      cart.id,
      {
        variant_id: variantId,
        quantity,   
      },
      {},
      headers
    )
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)
    })
    .catch(medusaError => {console.error("Error adding item to cart", medusaError); throw medusaError})
}

export type CartInventoryIssue = {
  lineId: string
  title: string
  requested: number
  available: number
}

export type ValidateCartInventoryResult =
  | { ok: true }
  | { ok: false; issues: CartInventoryIssue[] }

/**
 * Re-checks every line item in the cart against LIVE backend inventory.
 *
 * Medusa only reserves stock at cart completion, not when an item is added, so
 * a cart can go stale between "added" and "place order" (stock lowered in admin,
 * or another shopper buying the last unit). This is meant to run *before* the
 * customer is charged so a stale cart is caught up front rather than failing
 * after payment. It is advisory — the authoritative gate is still
 * completeCart() — and deliberately fails open: variants it can't resolve are
 * left for the backend to reject.
 */
export async function validateCartInventory(
  cartId?: string
): Promise<ValidateCartInventoryResult> {
  // Read live (noCache) — a cached cart would defeat the point of revalidating.
  const cart = await retrieveCart(cartId, "id,region_id,*items", {
    noCache: true,
  })

  if (!cart?.items?.length) {
    return { ok: true }
  }

  const productIds = Array.from(
    new Set(
      cart.items
        .map((item) => item.product_id)
        .filter((id): id is string => Boolean(id))
    )
  )

  if (!productIds.length) {
    return { ok: true }
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  // Pull fresh inventory for just the cart's products, straight from the
  // backend (no-store) so we don't read a stale cached value.
  const { products } = await sdk.client.fetch<{
    products: HttpTypes.StoreProduct[]
  }>(`/store/products`, {
    method: "GET",
    query: {
      id: productIds,
      limit: productIds.length,
      region_id: cart.region_id,
      fields:
        "id,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder",
    },
    headers,
    cache: "no-store",
  })

  const variantById = new Map<string, HttpTypes.StoreProductVariant>()
  for (const product of products ?? []) {
    for (const variant of product.variants ?? []) {
      if (variant.id) variantById.set(variant.id, variant)
    }
  }

  const issues: CartInventoryIssue[] = []
  for (const item of cart.items) {
    if (!item.variant_id) continue
    const variant = variantById.get(item.variant_id)
    // Can't resolve it — let completeCart be the authority.
    if (!variant) continue
    // Untracked or backorder-enabled variants can never oversell.
    if (!variant.manage_inventory) continue
    if (variant.allow_backorder) continue

    const available = variant.inventory_quantity ?? 0
    if (item.quantity > available) {
      issues.push({
        lineId: item.id,
        title: item.product_title ?? item.title ?? "An item in your cart",
        requested: item.quantity,
        available,
      })
    }
  }

  return issues.length ? { ok: false, issues } : { ok: true }
}

export async function updateLineItem({
  lineId,
  quantity,
}: {
  lineId: string
  quantity: number
}) {
  if (!lineId) {
    throw new Error("Missing lineItem ID when updating line item")
  }

  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("Missing cart ID when updating line item")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.cart
    .updateLineItem(cartId, lineId, { quantity }, {}, headers)
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)
    })
    .catch(medusaError)
}

export async function deleteLineItem(lineId: string) {
  if (!lineId) {
    throw new Error("Missing lineItem ID when deleting line item")
  }

  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("Missing cart ID when deleting line item")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.cart
    .deleteLineItem(cartId, lineId, {}, headers)
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)
    })
    .catch(medusaError)
}

export async function setShippingMethod({
  cartId,
  shippingMethodId,
}: {
  cartId: string
  shippingMethodId: string
}) {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.cart
    .addShippingMethod(cartId, { option_id: shippingMethodId }, {}, headers)
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
    })
    .catch(medusaError)
}

// Set ALL of a cart's shipping methods at once via the custom batch route.
//
// The built-in store endpoint accepts a single option and the underlying
// workflow removes every existing shipping method before adding it — so adding
// methods one profile at a time leaves only the last profile satisfied. A cart
// spanning multiple shipping profiles (e.g. coffee + event ticket) must have
// every profile's method attached in a single request, which this does.
export async function setShippingMethods({
  cartId,
  optionIds,
}: {
  cartId: string
  optionIds: string[]
}) {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.client
    .fetch(`/store/carts/${cartId}/shipping-methods-batch`, {
      method: "POST",
      body: { option_ids: optionIds },
      headers,
    })
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
    })
    .catch(medusaError)
}

export async function initiatePaymentSession(
  cart: HttpTypes.StoreCart,
  data: HttpTypes.StoreInitializePaymentSession
) {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.payment
    .initiatePaymentSession(cart, data, {}, headers)
    .then(async (resp) => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
      return resp
    })
    .catch(medusaError)
}

export async function applyPromotions(codes: string[]) {
  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("No existing cart found")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.cart
    .update(cartId, { promo_codes: codes }, {}, headers)
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)
    })
    .catch(medusaError)
}

export async function applyGiftCard(_code: string) {
  //   const cartId = getCartId()
  //   if (!cartId) return "No cartId cookie found"
  //   try {
  //     await updateCart(cartId, { gift_cards: [{ code }] }).then(() => {
  //       revalidateTag("cart")
  //     })
  //   } catch (error: any) {
  //     throw error
  //   }
}

export async function removeDiscount(_code: string) {
  // const cartId = getCartId()
  // if (!cartId) return "No cartId cookie found"
  // try {
  //   await deleteDiscount(cartId, code)
  //   revalidateTag("cart")
  // } catch (error: any) {
  //   throw error
  // }
}

export async function removeGiftCard(
  _codeToRemove: string,
  _giftCards: unknown[]
) {
  //   const cartId = getCartId()
  //   if (!cartId) return "No cartId cookie found"
  //   try {
  //     await updateCart(cartId, {
  //       gift_cards: [...giftCards]
  //         .filter((gc) => gc.code !== codeToRemove)
  //         .map((gc) => ({ code: gc.code })),
  //     }).then(() => {
  //       revalidateTag("cart")
  //     })
  //   } catch (error: any) {
  //     throw error
  //   }
}

export async function submitPromotionForm(
  currentState: unknown,
  formData: FormData
) {
  const code = formData.get("code") as string
  try {
    await applyPromotions([code])
  } catch (e: unknown) {
    return e instanceof Error ? e.message : String(e)
  }
}

// TODO: Pass a POJO instead of a form entity here
export async function setAddresses(currentState: unknown, formData: FormData) {
  try {
    if (!formData) {
      throw new Error("No form data found when setting addresses")
    }
    const cartId = getCartId()
    if (!cartId) {
      throw new Error("No existing cart found when setting addresses")
    }

    type AddressInput = Record<string, FormDataEntryValue | null | string>
    type CartAddressPayload = {
      shipping_address: AddressInput
      billing_address?: AddressInput
      email: FormDataEntryValue | null
    }

    const data: CartAddressPayload = {
      shipping_address: {
        first_name: formData.get("shipping_address.first_name"),
        last_name: formData.get("shipping_address.last_name"),
        address_1: formData.get("shipping_address.address_1"),
        address_2: "",
        company: formData.get("shipping_address.company"),
        postal_code: formData.get("shipping_address.postal_code"),
        city: formData.get("shipping_address.city"),
        country_code: formData.get("shipping_address.country_code"),
        province: formData.get("shipping_address.province"),
        phone: formData.get("shipping_address.phone"),
      },
      email: formData.get("email"),
    }

    const sameAsBilling = formData.get("same_as_billing")
    if (sameAsBilling === "on") data.billing_address = data.shipping_address

    if (sameAsBilling !== "on")
      data.billing_address = {
        first_name: formData.get("billing_address.first_name"),
        last_name: formData.get("billing_address.last_name"),
        address_1: formData.get("billing_address.address_1"),
        address_2: "",
        company: formData.get("billing_address.company"),
        postal_code: formData.get("billing_address.postal_code"),
        city: formData.get("billing_address.city"),
        country_code: formData.get("billing_address.country_code"),
        province: formData.get("billing_address.province"),
        phone: formData.get("billing_address.phone"),
      }
    await updateCart(data)
  } catch (e: unknown) {
    return e instanceof Error ? e.message : String(e)
  }

  redirect(
    `/${formData.get("shipping_address.country_code")}/checkout?step=delivery`
  )
}

/**
 * Places an order for a cart. If no cart ID is provided, it will use the cart ID from the cookies.
 * @param cartId - optional - The ID of the cart to place an order for.
 * @returns The cart object if the order was successful, or null if not.
 */
/**
 * Completes a cart into an order without redirecting. Returns the raw
 * completion response so callers can decide how to navigate. Use this from
 * client-driven flows (e.g. the Razorpay button) where a server-side redirect
 * thrown inside a React transition would be swallowed and never navigate.
 */
export async function completeCart(cartId?: string) {
  const id = cartId || (await getCartId())

  if (!id) {
    throw new Error("No existing cart found when placing an order")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const cartRes = await sdk.store.cart
    .complete(id, {}, headers)
    .then(async (cartRes) => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
      return cartRes
    })
    .catch(medusaError)

  if (cartRes?.type === "order") {
    const orderCacheTag = await getCacheTag("orders")
    revalidateTag(orderCacheTag)
    await removeCartId()
  }

  return cartRes
}

export async function placeOrder(cartId?: string) {
  const cartRes = await completeCart(cartId)

  if (cartRes?.type === "order") {
    const countryCode =
      cartRes.order.shipping_address?.country_code?.toLowerCase()

    // Send to the public order-confirmation page, not the account-gated order
    // details page — guests check out too and would otherwise be bounced to
    // login and never see their just-placed order.
    redirect(`/${countryCode}/order/${cartRes.order.id}/confirmed`)
  }

  return cartRes.cart
}

/**
 * Updates the countrycode param and revalidates the regions cache
 * @param regionId
 * @param countryCode
 */
export async function updateRegion(countryCode: string, currentPath: string) {
  const cartId = await getCartId()
  const region = await getRegion(countryCode)

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  if (cartId) {
    await updateCart({ region_id: region.id })
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
  }

  const regionCacheTag = await getCacheTag("regions")
  revalidateTag(regionCacheTag)

  const productsCacheTag = await getCacheTag("products")
  revalidateTag(productsCacheTag)

  redirect(`/${countryCode}${currentPath}`)
}

export async function listCartOptions() {
  const cartId = await getCartId()
  const headers = {
    ...(await getAuthHeaders()),
  }
  const next = {
    ...(await getCacheOptions("shippingOptions")),
  }

  return await sdk.client.fetch<{
    shipping_options: HttpTypes.StoreCartShippingOption[]
  }>("/store/shipping-options", {
    query: { cart_id: cartId },
    next,
    headers,
    cache: "force-cache",
  })
}

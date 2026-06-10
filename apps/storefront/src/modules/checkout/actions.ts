"use server"

import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import { isRedirectError } from "next/dist/client/components/redirect-error"

import { getCacheTag, getCartId } from "@lib/data/cookies"
import {
  completeCart,
  initiatePaymentSession,
  placeOrder,
  setShippingMethod,
  updateCart,
} from "@lib/data/cart"

// The only payment provider offered at checkout. The picker UI was removed —
// the Razorpay session is created automatically when the customer reaches the
// payment step.
const RAZORPAY_PROVIDER_ID = "pp_razorpay_razorpay"
import { retrieveCart } from "@lib/data/cart"
import { upsertDefaultShippingAddress } from "@lib/data/customer"
import { listCartShippingMethods } from "@lib/data/fulfillment"

type AddressFields = {
  first_name: string
  last_name: string
  address_1: string
  address_2?: string
  city: string
  postal_code: string
  province?: string
  country_code: string
  phone: string
  email: string
}

function readAddressFields(formData: FormData): {
  values: AddressFields
  errors: Record<string, string>
} {
  const required = [
    "first_name",
    "last_name",
    "address_1",
    "city",
    "postal_code",
    "country_code",
    "phone",
    "email",
  ] as const

  const errors: Record<string, string> = {}
  const values = {} as AddressFields

  for (const field of required) {
    const value = (formData.get(field) as string | null)?.trim() ?? ""
    if (!value) errors[field] = "Required"
    ;(values as Record<string, string>)[field] = value
  }

  values.address_2 = (formData.get("address_2") as string | null)?.trim() ?? ""
  values.province = (formData.get("province") as string | null)?.trim() ?? ""

  if (values.email && !/^\S+@\S+\.\S+$/.test(values.email)) {
    errors.email = "Enter a valid email"
  }
  if (values.postal_code && !/^\d+$/.test(values.postal_code)) {
    errors.postal_code = "Numbers only"
  }
  if (values.phone && !/^[0-9+\-\s()]{6,}$/.test(values.phone)) {
    errors.phone = "Enter a valid phone"
  }

  return { values, errors }
}

export type CheckoutFormState = {
  errors: Record<string, string>
  message: string | null
  values?: Partial<AddressFields>
}

export async function saveCheckoutAddress(
  _prev: CheckoutFormState,
  formData: FormData
): Promise<CheckoutFormState> {
  const { values, errors } = readAddressFields(formData)

  if (Object.keys(errors).length) {
    return {
      errors,
      message: "Please fix the highlighted fields.",
      values,
    }
  }

  try {
    const cartId = await getCartId()
    if (!cartId) {
      return {
        errors: {},
        message: "Your bag has expired. Please add an item again.",
      }
    }

    const sameAsBilling = formData.get("same_as_billing") !== "off"
    const shippingAddress = {
      first_name: values.first_name,
      last_name: values.last_name,
      address_1: values.address_1,
      address_2: values.address_2 || undefined,
      city: values.city,
      postal_code: values.postal_code,
      province: values.province || undefined,
      country_code: values.country_code.toLowerCase(),
      phone: values.phone,
    }

    await updateCart({
      email: values.email,
      shipping_address: shippingAddress,
      billing_address: sameAsBilling ? shippingAddress : shippingAddress,
    })

    const saveAsDefault = formData.get("save_as_default_shipping") === "on"
    if (saveAsDefault) {
      // Best-effort: failures here shouldn't break checkout.
      await upsertDefaultShippingAddress({
        first_name: values.first_name,
        last_name: values.last_name,
        address_1: values.address_1,
        address_2: values.address_2 || undefined,
        city: values.city,
        postal_code: values.postal_code,
        province: values.province || undefined,
        country_code: shippingAddress.country_code,
        phone: values.phone,
      })
    }

    // Best-effort auto-select shipping so the next step doesn't have to
    // surface a "no delivery option attached" warning. Silently skip if
    // no options come back — the place-order action also retries this.
    try {
      await ensureShippingSelected()
    } catch {
      // noop
    }

    // Create the Razorpay session here too, so the "Review & Place Order" step
    // shows the pay button immediately after the address is saved — without
    // this the session is only created on the next page render, so the customer
    // would have to refresh to load Razorpay.
    try {
      await ensureRazorpaySession()
    } catch {
      // noop — the checkout page also creates the session on load.
    }

    return { errors: {}, message: null, values }
  } catch (e) {
    return {
      errors: {},
      message: e instanceof Error ? e.message : "Could not save address.",
      values,
    }
  }
}

export async function selectShippingMethod(formData: FormData) {
  const shippingOptionId = formData.get("shipping_option_id") as string | null
  if (!shippingOptionId) {
    throw new Error("Please choose a shipping method.")
  }

  const cartId = await getCartId()
  if (!cartId) {
    throw new Error("Your bag has expired. Please add an item again.")
  }

  await setShippingMethod({ cartId, shippingMethodId: shippingOptionId })

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag)
  const fulfillmentCacheTag = await getCacheTag("fulfillment")
  revalidateTag(fulfillmentCacheTag)
}

export async function initPayment(formData: FormData) {
  const providerId = formData.get("provider_id") as string | null
  if (!providerId) return

  const cart = await retrieveCart()
  if (!cart) return

  await initiatePaymentSession(cart, { provider_id: providerId })

  // Use a real Authorization header for headless backends to mark the session
  const cacheTag = await getCacheTag("carts")
  revalidateTag(cacheTag)
}

export async function placeOrderAction(formData: FormData) {
  const countryCode =
    (formData.get("country_code") as string | null)?.toLowerCase() || "in"
  try {
    // Safety net: auto-pick a shipping method if none is selected yet.
    // The UI picker is the primary path; this catches edge cases.
    await ensureShippingSelected()
    await placeOrder()
  } catch (e) {
    // placeOrder() redirects to the order page on success, which surfaces here
    // as a Next redirect "error" — let it propagate instead of treating it as
    // a failure.
    if (isRedirectError(e)) throw e
    const message = e instanceof Error ? e.message : "Could not place order"
    redirect(
      `/${countryCode}/checkout?error=${encodeURIComponent(message)}`
    )
  }
}

export type PlaceRazorpayOrderResult =
  | { success: true; redirectTo: string }
  | { success: false; error: string }

/**
 * Completes the cart after a successful Razorpay payment and RETURNS where to
 * navigate, rather than issuing a server-side redirect. This is called from the
 * Razorpay button inside a React transition, where a thrown redirect would be
 * swallowed and never navigate — leaving the customer stuck on the payment
 * window. The client navigates with router.push using redirectTo.
 */
export async function placeRazorpayOrder(input: {
  cartId: string
  countryCode: string
}): Promise<PlaceRazorpayOrderResult> {
  const cacheTag = await getCacheTag("carts")
  revalidateTag(cacheTag)

  try {
    const cartRes = await completeCart(input.cartId)
    if (cartRes?.type === "order") {
      const countryCode =
        cartRes.order.shipping_address?.country_code?.toLowerCase() ||
        input.countryCode.toLowerCase()
      return {
        success: true,
        redirectTo: `/${countryCode}/order/${cartRes.order.id}/confirmed`,
      }
    }
    return {
      success: false,
      error: "Payment could not be confirmed. Please contact support.",
    }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Could not place order",
    }
  }
}

// Auto-create the Razorpay payment session when none is pending yet. Idempotent:
// if a pending session already exists we leave it, so re-renders of the checkout
// page don't spin up duplicate Razorpay orders.
export async function ensureRazorpaySession() {
  // Read fresh: a cached cart can miss a shipping method that was just selected
  // (or a session that was just created), causing us to skip or duplicate work.
  const cart = await retrieveCart(undefined, undefined, { noCache: true })
  if (!cart) return null

  const pending = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )
  if (pending) return pending

  await initiatePaymentSession(cart, { provider_id: RAZORPAY_PROVIDER_ID })
  return null
}

export async function ensureShippingSelected() {
  const cart = await retrieveCart(undefined, undefined, { noCache: true })
  if (!cart) return null

  if (cart.shipping_methods?.length) return cart.shipping_methods[0]

  const options = await listCartShippingMethods(cart.id)
  if (!options?.length) return null

  // Auto-pick the cheapest flat-rate option so the checkout can complete
  const flatRate = options.find((o) => o.price_type === "flat") ?? options[0]
  await setShippingMethod({ cartId: cart.id, shippingMethodId: flatRate.id })
  return flatRate
}

"use server"

import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { HttpTypes } from "@medusajs/types"

import { getCacheTag, getCartId } from "@lib/data/cookies"
import {
  completeCart,
  initiatePaymentSession,
  placeOrder,
  setShippingMethod,
  setShippingMethods,
  updateCart,
  validateCartInventory,
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
  email?: string
}

// Reads one address from the form. `prefix` namespaces the inputs (the separate
// shipping address uses `ship_` so it doesn't collide with the billing one);
// error keys are returned with the same prefix so the form can highlight the
// right field. Email is only part of the billing address (the invoice email).
function readAddressFields(
  formData: FormData,
  opts: { prefix?: string; withEmail?: boolean } = {}
): {
  values: AddressFields
  errors: Record<string, string>
} {
  const prefix = opts.prefix ?? ""
  const withEmail = opts.withEmail ?? false

  const required = [
    "first_name",
    "last_name",
    "address_1",
    "city",
    "postal_code",
    "country_code",
    "phone",
  ]
  if (withEmail) required.push("email")

  const errors: Record<string, string> = {}
  const values = {} as AddressFields
  const get = (field: string) =>
    (formData.get(prefix + field) as string | null)?.trim() ?? ""

  for (const field of required) {
    const value = get(field)
    if (!value) errors[prefix + field] = "Required"
    ;(values as Record<string, string>)[field] = value
  }

  values.address_2 = get("address_2")
  values.province = get("province")

  if (withEmail && values.email && !/^\S+@\S+\.\S+$/.test(values.email)) {
    errors[prefix + "email"] = "Enter a valid email"
  }
  if (values.postal_code && !/^\d+$/.test(values.postal_code)) {
    errors[prefix + "postal_code"] = "Numbers only"
  }
  if (values.phone && !/^[0-9+\-\s()]{6,}$/.test(values.phone)) {
    errors[prefix + "phone"] = "Enter a valid phone"
  }

  return { values, errors }
}

const toAddressPayload = (v: AddressFields) => ({
  first_name: v.first_name,
  last_name: v.last_name,
  address_1: v.address_1,
  address_2: v.address_2 || undefined,
  city: v.city,
  postal_code: v.postal_code,
  province: v.province || undefined,
  country_code: v.country_code.toLowerCase(),
  phone: v.phone,
})

export type CheckoutFormState = {
  errors: Record<string, string>
  message: string | null
  values?: Partial<AddressFields>
  shipValues?: Partial<AddressFields>
}

export async function saveCheckoutAddress(
  _prev: CheckoutFormState,
  formData: FormData
): Promise<CheckoutFormState> {
  // The primary fields are the BILLING address (this is what the invoice email
  // shows). The shipping address defaults to it; when the customer unchecks
  // "shipping same as billing" we collect a separate shipping address.
  const { values, errors } = readAddressFields(formData, { withEmail: true })

  const shipSameAsBilling = formData.get("ship_same_as_billing") === "on"
  let shipValues: AddressFields = values
  let shipErrors: Record<string, string> = {}
  if (!shipSameAsBilling) {
    const ship = readAddressFields(formData, { prefix: "ship_" })
    shipValues = ship.values
    shipErrors = ship.errors
  }

  const allErrors = { ...errors, ...shipErrors }
  if (Object.keys(allErrors).length) {
    return {
      errors: allErrors,
      message: "Please fix the highlighted fields.",
      values,
      shipValues: shipSameAsBilling ? undefined : shipValues,
    }
  }

  try {
    const cartId = await getCartId()
    if (!cartId) {
      return {
        errors: {},
        message: "Your cart has expired. Please add an item again.",
      }
    }

    const billingAddress = toAddressPayload(values)
    const shippingAddress = shipSameAsBilling
      ? billingAddress
      : toAddressPayload(shipValues)

    await updateCart({
      email: values.email,
      shipping_address: shippingAddress,
      billing_address: billingAddress,
    })

    const saveAsDefault = formData.get("save_as_default_shipping") === "on"
    if (saveAsDefault) {
      // Best-effort: failures here shouldn't break checkout. Save the actual
      // shipping (delivery) address as the default.
      await upsertDefaultShippingAddress(toAddressPayload(shipValues))
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
    throw new Error("Your cart has expired. Please add an item again.")
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

export type CheckCartInventoryResult =
  | { ok: true }
  | { ok: false; error: string }

/**
 * Pre-payment guard: verify the cart still has stock against LIVE inventory
 * before opening the Razorpay window. Catches a stale cart (stock lowered, or
 * another shopper took the last unit) up front so the customer isn't charged
 * for an order that completeCart would later reject. Fails open on unexpected
 * errors — completeCart remains the authoritative gate.
 */
export async function checkCartInventory(
  cartId: string
): Promise<CheckCartInventoryResult> {
  try {
    const result = await validateCartInventory(cartId)
    if (result.ok) return { ok: true }

    const lines = result.issues.map((issue) => {
      if (issue.available <= 0) {
        return `${issue.title} is now out of stock`
      }
      return `${issue.title}: only ${issue.available} left (you have ${issue.requested})`
    })

    const error =
      lines.length === 1
        ? `${lines[0]}. Please update your cart before paying.`
        : `Some items are no longer available:\n${lines
            .map((l) => `• ${l}`)
            .join("\n")}\nPlease update your cart before paying.`

    return { ok: false, error }
  } catch {
    // Don't block checkout on a validation hiccup — completeCart still guards.
    return { ok: true }
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
    // Safety net: a mixed cart (coffee + ticket) needs a shipping method per
    // shipping profile, or completeCart rejects it. Fill any gaps first.
    await ensureShippingSelected().catch(() => null)
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

// Full idempotent "make checkout payable" sequence, callable from the client to
// recover when the server render couldn't prepare payment (a transient backend
// hiccup during shipping selection or session creation leaves no pending
// session). Ensures shipping is attached FIRST — the Razorpay order amount must
// include shipping — then ensures the payment session, then reports whether a
// pending session now exists so the caller knows if it can stop retrying.
export async function ensureCheckoutReady(): Promise<{ ready: boolean }> {
  try {
    await ensureShippingSelected()
  } catch {
    // best-effort
  }
  try {
    await ensureRazorpaySession()
  } catch {
    // best-effort
  }

  const cart = await retrieveCart(undefined, undefined, { noCache: true })
  const ready = !!cart?.payment_collection?.payment_sessions?.some(
    (s) => s.status === "pending"
  )
  return { ready }
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

// Resolve the shipping profiles the cart's items actually REQUIRE. The store
// `/store/shipping-options` endpoint returns every store option (all profiles),
// not just the cart's — so we can't infer requirements from the option list.
// We read it from each line item's product → shipping_profile link instead.
async function getRequiredShippingProfiles(
  cartId: string
): Promise<Set<string>> {
  const detailed = await retrieveCart(
    cartId,
    "id,items.id,items.product.shipping_profile.id",
    { noCache: true }
  ).catch(() => null)

  const required = new Set<string>()
  for (const item of detailed?.items ?? []) {
    const profileId = (
      item as unknown as {
        product?: { shipping_profile?: { id?: string } | null } | null
      }
    ).product?.shipping_profile?.id
    if (profileId) required.add(profileId)
  }
  return required
}

export async function ensureShippingSelected() {
  const cart = await retrieveCart(undefined, undefined, { noCache: true })
  if (!cart) return null

  const options = await listCartShippingMethods(cart.id)
  if (!options?.length) return null

  // A cart's items can span MULTIPLE shipping profiles (e.g. coffee on the
  // Shipmozo profile + an event ticket on the "Digital Delivery" profile).
  // Medusa requires exactly one shipping method PER required profile, or
  // completing the cart fails with "items require shipping profiles that are not
  // satisfied by the current shipping methods".
  //
  // CRITICAL: the core `addShippingMethodToCartWorkflow` REMOVES every existing
  // shipping method before adding the ones passed in a call, and the built-in
  // store endpoint only accepts a single option per request. Attaching profiles
  // one at a time therefore wipes the previous profile's method, so a mixed cart
  // can never have both satisfied that way. We instead pick one option per
  // REQUIRED profile and attach them ALL in a single batch request.
  const requiredProfiles = await getRequiredShippingProfiles(cart.id)

  const profileByOption = new Map(
    options.map((o) => [o.id, o.shipping_profile_id])
  )

  const optionsByProfile = new Map<
    string,
    HttpTypes.StoreCartShippingOption[]
  >()
  for (const o of options) {
    const list = optionsByProfile.get(o.shipping_profile_id) ?? []
    list.push(o)
    optionsByProfile.set(o.shipping_profile_id, list)
  }

  // Scope to the cart's required profiles. If we couldn't resolve them (query
  // failure), fall back to every offered profile so a normal single-profile
  // cart still gets a method.
  const targetProfiles = requiredProfiles.size
    ? [...requiredProfiles]
    : [...optionsByProfile.keys()]

  // Already fully satisfied? Skip the round-trip (and avoid needlessly
  // removing + re-adding methods). "Satisfied" = a method exists for every
  // target profile and there are no stray methods for other profiles.
  const coveredProfiles = new Set(
    (cart.shipping_methods ?? [])
      .map((m) =>
        m.shipping_option_id
          ? profileByOption.get(m.shipping_option_id)
          : undefined
      )
      .filter((p): p is string => !!p)
  )
  const alreadySatisfied =
    targetProfiles.length > 0 &&
    targetProfiles.every((p) => coveredProfiles.has(p)) &&
    (cart.shipping_methods?.length ?? 0) === targetProfiles.length
  if (alreadySatisfied) return null

  // Pick the cheapest flat-rate option for each target profile.
  const pickedIds: string[] = []
  for (const profileId of targetProfiles) {
    const profileOptions = optionsByProfile.get(profileId)
    if (!profileOptions?.length) continue

    const flatRates = profileOptions
      .filter((o) => o.price_type === "flat" && typeof o.amount === "number")
      .sort((a, b) => (a.amount ?? 0) - (b.amount ?? 0))
    const choice = flatRates[0] ?? profileOptions[0]
    pickedIds.push(choice.id)
  }
  if (!pickedIds.length) return null

  await setShippingMethods({ cartId: cart.id, optionIds: pickedIds })
  return pickedIds
}

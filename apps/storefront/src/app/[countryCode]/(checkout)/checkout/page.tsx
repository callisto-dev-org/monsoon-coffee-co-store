import { Metadata } from "next"
import { redirect } from "next/navigation"

import { retrieveCart, updateCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { listCartShippingMethods } from "@lib/data/fulfillment"
import { getRegion } from "@lib/data/regions"
import MonsoonCheckout from "@modules/checkout/templates/monsoon-checkout"
import {
  ensureRazorpaySession,
  ensureShippingSelected,
} from "@modules/checkout/actions"

export const metadata: Metadata = {
  title: "Checkout — Monsoon Coffee Co.",
}

export default async function CheckoutPage(props: {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { countryCode } = await props.params
  const { error } = await props.searchParams

  // Read fresh (no cache) throughout: this page mutates the cart in steps
  // (address → shipping → payment session) and re-reads it within the same
  // render, so a cached read would lag a step behind and strand the payment
  // step on "Preparing secure payment…".
  let cart = await retrieveCart(undefined, undefined, { noCache: true })

  if (!cart || !cart.items?.length) {
    redirect(`/${countryCode}/cart`)
  }

  // Guests can check out — login is optional. When the shopper is signed in we
  // use their saved details for prefill/auto-address below; otherwise they
  // simply enter an email + address in the form.
  const customer = await retrieveCustomer().catch(() => null)

  const region = await getRegion(countryCode)
  if (!region) {
    redirect(`/${countryCode}/cart`)
  }

  // If the cart has no shipping address yet, but the customer has a default
  // shipping address that's in this region, auto-apply it so the form is
  // pre-filled and the order can move forward.
  if (!cart.shipping_address?.address_1 && customer) {
    const regionCountries = new Set(
      (region.countries ?? [])
        .map((c) => c.iso_2?.toLowerCase())
        .filter((c): c is string => !!c)
    )
    const fallback =
      customer.addresses?.find(
        (a) =>
          a.is_default_shipping &&
          a.country_code &&
          regionCountries.has(a.country_code.toLowerCase())
      ) ??
      customer.addresses?.find(
        (a) =>
          a.country_code && regionCountries.has(a.country_code.toLowerCase())
      )

    if (fallback) {
      try {
        const shippingAddress = {
          first_name: fallback.first_name ?? "",
          last_name: fallback.last_name ?? "",
          address_1: fallback.address_1 ?? "",
          address_2: fallback.address_2 ?? "",
          city: fallback.city ?? "",
          postal_code: fallback.postal_code ?? "",
          province: fallback.province ?? "",
          country_code: fallback.country_code?.toLowerCase() ?? "",
          phone: fallback.phone ?? "",
          company: fallback.company ?? "",
        }
        await updateCart({
          email: cart.email ?? customer.email ?? undefined,
          shipping_address: shippingAddress,
          billing_address: shippingAddress,
        })
        cart = (await retrieveCart(undefined, undefined, { noCache: true })) ?? cart
      } catch {
        // Best-effort — fall through to manual entry on failure
      }
    }
  }

  const hasAddress = !!cart.shipping_address?.address_1

  // Auto-pick a shipping method as soon as we have an address — the
  // checkout no longer asks the customer to choose one. ensureShippingSelected
  // is a no-op when a method is already attached.
  if (hasAddress && !cart.shipping_methods?.length) {
    try {
      const options = await listCartShippingMethods(cart.id).catch(() => null)
      if (options?.length) {
        await ensureShippingSelected()
        cart = (await retrieveCart(undefined, undefined, { noCache: true })) ?? cart
      }
    } catch {
      // Best-effort — placeOrderAction also calls ensureShippingSelected as a
      // safety net before placing the order.
    }
  }

  // The payment-method picker was removed — Razorpay is the only option. Once an
  // address (and thus shipping) is in place, auto-create the Razorpay session so
  // the customer goes straight to "Review & Place Order". Idempotent.
  if (
    hasAddress &&
    cart.shipping_methods?.length &&
    !cart.payment_collection?.payment_sessions?.some(
      (s) => s.status === "pending"
    )
  ) {
    try {
      await ensureRazorpaySession()
      cart = (await retrieveCart(undefined, undefined, { noCache: true })) ?? cart
    } catch {
      // Best-effort — the customer can still retry from the review step.
    }
  }

  return (
    <MonsoonCheckout
      cart={cart}
      region={region}
      customer={customer}
      countryCode={countryCode}
      errorMessage={error}
    />
  )
}

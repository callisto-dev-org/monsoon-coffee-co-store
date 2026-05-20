import { Metadata } from "next"
import { redirect } from "next/navigation"

import { retrieveCart, updateCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { listCartPaymentMethods } from "@lib/data/payment"
import {
  calculatePriceForShippingOption,
  listCartShippingMethods,
} from "@lib/data/fulfillment"
import { getRegion } from "@lib/data/regions"
import MonsoonCheckout from "@modules/checkout/templates/monsoon-checkout"
import { HttpTypes } from "@medusajs/types"

export const metadata: Metadata = {
  title: "Checkout — Monsoon Coffee Co.",
}

export default async function CheckoutPage(props: {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { countryCode } = await props.params
  const { error } = await props.searchParams

  let cart = await retrieveCart()

  if (!cart || !cart.items?.length) {
    redirect(`/${countryCode}/cart`)
  }

  const customer = await retrieveCustomer().catch(() => null)
  if (!customer) {
    const returnTo = encodeURIComponent(`/${countryCode}/checkout`)
    redirect(`/${countryCode}/auth/login?returnTo=${returnTo}`)
  }

  const region = await getRegion(countryCode)
  if (!region) {
    redirect(`/${countryCode}/cart`)
  }

  // If the cart has no shipping address yet, but the customer has a default
  // shipping address that's in this region, auto-apply it so the form is
  // pre-filled and the order can move forward.
  if (!cart.shipping_address?.address_1) {
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
        cart = (await retrieveCart()) ?? cart
      } catch {
        // Best-effort — fall through to manual entry on failure
      }
    }
  }

  const hasAddress = !!cart.shipping_address?.address_1

  const [paymentProviders, rawShippingOptions] = await Promise.all([
    listCartPaymentMethods(region.id).catch(() => null),
    hasAddress
      ? listCartShippingMethods(cart.id).catch(() => null)
      : Promise.resolve(null),
  ])

  const shippingOptions = await resolveShippingPrices(
    rawShippingOptions ?? [],
    cart.id
  )

  return (
    <MonsoonCheckout
      cart={cart}
      region={region}
      customer={customer}
      paymentProviders={paymentProviders ?? []}
      shippingOptions={shippingOptions}
      countryCode={countryCode}
      errorMessage={error}
    />
  )
}

async function resolveShippingPrices(
  options: HttpTypes.StoreCartShippingOption[],
  cartId: string
): Promise<HttpTypes.StoreCartShippingOption[]> {
  return Promise.all(
    options.map(async (opt) => {
      if (opt.price_type !== "calculated") return opt
      const calculated = await calculatePriceForShippingOption(opt.id, cartId)
      if (!calculated) return opt
      return { ...opt, amount: calculated.amount }
    })
  )
}

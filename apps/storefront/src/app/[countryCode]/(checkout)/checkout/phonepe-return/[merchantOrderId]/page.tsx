import { redirect } from "next/navigation"

import { retrieveCart, placeOrder } from "@lib/data/cart"

type Params = {
  params: Promise<{
    countryCode: string
    merchantOrderId: string
  }>
  searchParams: Promise<Record<string, string | undefined>>
}

/**
 * PhonePe redirects the customer back here after they complete (or abandon)
 * the payment in the hosted PhonePe page / UPI app. The page is server-only:
 * we trust the active payment session on the cart, ask Medusa to complete it,
 * and let the provider's `authorizePayment` re-verify the status with PhonePe
 * before transitioning the cart into an order.
 */
export default async function PhonePeReturnPage({
  params,
  searchParams,
}: Params) {
  const { countryCode } = await params
  const sp = (await searchParams) ?? {}

  const cart = await retrieveCart().catch(() => null)
  if (!cart) {
    redirect(`/${countryCode}/cart`)
  }

  // If PhonePe explicitly tells us it failed, kick the user back to checkout
  // with the message rather than trying to complete.
  const state = (sp.state ?? sp.code ?? "").toUpperCase()
  if (state && state !== "COMPLETED" && state !== "SUCCESS") {
    const message =
      sp.message ??
      (state === "USER_CANCEL"
        ? "Payment cancelled in PhonePe."
        : `PhonePe reported: ${state}`)
    redirect(
      `/${countryCode}/checkout?error=${encodeURIComponent(message)}`
    )
  }

  try {
    await placeOrder(cart!.id)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not place order"
    redirect(
      `/${countryCode.toLowerCase()}/checkout?error=${encodeURIComponent(message)}`
    )
  }

  // `placeOrder` throws a redirect on success, so we should never get here —
  // but if it returned a cart (cart didn't complete), send the user back.
  redirect(`/${countryCode}/checkout`)
}

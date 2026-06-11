import { Metadata } from "next"

import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { getBaseURL } from "@lib/util/env"
import CartMismatchBanner from "@modules/layout/components/cart-mismatch-banner"
import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

// This layout reads per-request cookies (customer + cart) on every page below
// it. The defensive try/catch in cookies.ts and the .catch() guards on the data
// calls swallow the DynamicServerError that Next uses to auto-detect dynamic
// usage, so without this Next mis-classifies pages with generateStaticParams
// (products/collections/categories) as static and bakes them. Those baked
// routes then throw DYNAMIC_SERVER_USAGE on on-demand revalidation. Forcing
// dynamic renders fixes the classification; backend data is still cached via
// the force-cache fetch tags.
export const dynamic = "force-dynamic"

export default async function PageLayout(props: { children: React.ReactNode }) {
  const customer = await retrieveCustomer()
  const cart = await retrieveCart()

  return (
    <>
      <Nav />
      {customer && cart && (
        <CartMismatchBanner customer={customer} cart={cart} />
      )}

      {props.children}
      <Footer />
    </>
  )
}

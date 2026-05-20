import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import MonsoonHeader from "./monsoon-header"

export default async function Nav() {
  const [cart, customer] = await Promise.all([
    retrieveCart().catch(() => null),
    retrieveCustomer().catch(() => null),
  ])
  const cartItemCount =
    cart?.items?.reduce((sum, item) => sum + (item.quantity ?? 0), 0) ?? 0

  return (
    <MonsoonHeader
      cartItemCount={cartItemCount}
      isAuthenticated={!!customer}
    />
  )
}

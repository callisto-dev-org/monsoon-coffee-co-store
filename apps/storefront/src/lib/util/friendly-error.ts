// Turns raw backend/Medusa error strings into short, shopper-friendly copy.
// Used anywhere a cart/checkout error could surface to a customer so they never
// see internal phrasing like "Some variant does not have the required inventory".
export function friendlyError(raw: unknown): string {
  const msg = (
    raw instanceof Error ? raw.message : typeof raw === "string" ? raw : ""
  )
    .toString()
    .toLowerCase()

  if (!msg) return "Something went wrong. Please try again."

  // Out of stock / inventory.
  if (
    msg.includes("inventory") ||
    msg.includes("out of stock") ||
    msg.includes("not enough") ||
    msg.includes("insufficient") ||
    msg.includes("stock")
  ) {
    return "This product is currently unavailable."
  }

  // Shipping not configured / unsatisfied for the item.
  if (msg.includes("shipping") && (msg.includes("profile") || msg.includes("method") || msg.includes("option"))) {
    return "Delivery isn't available for one of your items right now."
  }

  // Payment problems.
  if (msg.includes("payment") || msg.includes("authoriz") || msg.includes("declin")) {
    return "We couldn't process the payment. Please try again or use another method."
  }

  // Couldn't reach the backend.
  if (
    msg.includes("fetch failed") ||
    msg.includes("network") ||
    msg.includes("econnrefused") ||
    msg.includes("timeout") ||
    msg.includes(":9000") ||
    msg.includes("failed to fetch")
  ) {
    return "We couldn't reach the store. Please try again in a moment."
  }

  return "Something went wrong. Please try again."
}

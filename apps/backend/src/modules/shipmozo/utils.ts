import { ShipmozoCourierRate } from "./types"

/**
 * Convert a Medusa monetary amount (BigNumber-ish — kept as `unknown` to
 * mirror how Medusa hands them in) into a plain number of major units.
 * Medusa stores money as the major unit (e.g. 49 INR), so we just coerce.
 */
export const toMajorUnits = (amount: unknown): number => {
  if (amount === null || amount === undefined) return 0
  if (typeof amount === "number") return amount
  if (typeof amount === "string") return Number(amount) || 0
  if (typeof amount === "object" && amount !== null) {
    const maybe = amount as { numeric?: number; toNumber?: () => number }
    if (typeof maybe.numeric === "number") return maybe.numeric
    if (typeof maybe.toNumber === "function") return maybe.toNumber()
  }
  return Number(amount) || 0
}

/** Round to 2 decimal places (the cleanest representation for INR). */
export const round2 = (n: number): number => Math.round(n * 100) / 100

/** Strip every non-digit and return as a number (or 0 if nothing left). */
export const digitsToNumber = (raw: string | null | undefined): number => {
  if (!raw) return 0
  const stripped = String(raw).replace(/\D/g, "")
  return stripped ? Number(stripped) : 0
}

/**
 * Normalize a phone to the 10-digit national number Shipmozo demands (it
 * rejects anything that isn't exactly 10 digits with "The consignee phone must
 * be 10 digits"). Strips non-digits, then keeps the last 10 — which drops a
 * "+91" country code or a leading trunk "0". Returns 0 when fewer than 10
 * digits remain so callers can treat it as missing.
 */
export const toPhone10 = (raw: string | null | undefined): number => {
  if (!raw) return 0
  const digits = String(raw).replace(/\D/g, "")
  if (digits.length < 10) return 0
  return Number(digits.slice(-10))
}

/** Format a Date (or now) as YYYY-MM-DD — required by /push-order. */
export const formatOrderDate = (d: Date = new Date()): string => {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

/**
 * Pick the cheapest rate from a Shipmozo rate-calculator response.
 * If `preferredCourierId` is supplied and present in the list it wins
 * regardless of price. Returns `undefined` if no entry has a usable price.
 */
export const pickCheapestRate = (
  rates: ShipmozoCourierRate[] | undefined,
  preferredCourierId?: string | number
): ShipmozoCourierRate | undefined => {
  if (!rates?.length) return undefined

  const priceOf = (r: ShipmozoCourierRate): number | undefined => {
    const raw = r.total_charges ?? r.rate ?? r.freight_charges
    if (raw === undefined || raw === null) return undefined
    const n = typeof raw === "number" ? raw : Number(raw)
    return Number.isFinite(n) ? n : undefined
  }

  if (preferredCourierId !== undefined && preferredCourierId !== "") {
    const match = rates.find(
      (r) => String(r.courier_id ?? "") === String(preferredCourierId)
    )
    if (match) return match
  }

  let best: { rate: ShipmozoCourierRate; price: number } | undefined
  for (const rate of rates) {
    const price = priceOf(rate)
    if (price === undefined) continue
    if (!best || price < best.price) best = { rate, price }
  }
  return best?.rate
}

/** Pull the price number out of a rate row using the same fallback chain. */
export const ratePrice = (r: ShipmozoCourierRate): number => {
  const raw = r.total_charges ?? r.rate ?? r.freight_charges ?? 0
  return typeof raw === "number" ? raw : Number(raw) || 0
}

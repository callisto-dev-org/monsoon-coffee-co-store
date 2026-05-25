import { BigNumber, MathBN } from "@medusajs/framework/utils"
import { BigNumberInput } from "@medusajs/framework/types"

/**
 * PhonePe expects amounts in paise (smallest INR unit). The PG v2 APIs are
 * INR-only at the time of writing, but we keep a tiny conversion helper so
 * the rest of the module mirrors the Stripe shape.
 */
const CURRENCY_MULTIPLIERS: Record<number, string[]> = {
  0: [
    "BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA",
    "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF",
  ],
  3: ["BHD", "IQD", "JOD", "KWD", "OMR", "TND"],
}

function getCurrencyMultiplier(currency: string): number {
  const upper = currency.toUpperCase()
  let power = 2
  for (const [key, codes] of Object.entries(CURRENCY_MULTIPLIERS)) {
    if (codes.includes(upper)) {
      power = parseInt(key, 10)
      break
    }
  }
  return Math.pow(10, power)
}

export function getSmallestUnit(
  amount: BigNumberInput,
  currency: string
): number {
  const multiplier = getCurrencyMultiplier(currency)
  const scaled =
    Math.round(new BigNumber(MathBN.mult(amount, multiplier)).numeric) /
    multiplier
  let numeric = new BigNumber(MathBN.mult(scaled, multiplier)).numeric
  if (multiplier === 1e3) {
    numeric = Math.ceil(numeric / 10) * 10
  }
  return parseInt(numeric.toString().split(".").shift() as string, 10)
}

export function getAmountFromSmallestUnit(
  amount: BigNumberInput,
  currency: string
): number {
  const multiplier = getCurrencyMultiplier(currency)
  return new BigNumber(MathBN.div(amount, multiplier)).numeric
}

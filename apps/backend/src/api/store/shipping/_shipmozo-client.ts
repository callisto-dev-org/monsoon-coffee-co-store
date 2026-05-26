import type { ShipmozoCourierRate } from "../../../modules/shipmozo/types"

const BASE = "https://shipping-api.com/app/api/v1"

type Envelope<T> = {
  result: "1" | "0" | string
  message?: string
  data?: T
}

function requireEnv(): {
  publicKey: string
  privateKey: string
} {
  const publicKey = process.env.SHIPMOZO_PUBLIC_KEY
  const privateKey = process.env.SHIPMOZO_PRIVATE_KEY
  if (!publicKey || !privateKey) {
    throw new Error(
      "Shipmozo credentials are not configured (SHIPMOZO_PUBLIC_KEY / SHIPMOZO_PRIVATE_KEY)."
    )
  }
  return { publicKey, privateKey }
}

async function shipmozoFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const { publicKey, privateKey } = requireEnv()
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "public-key": publicKey,
      "private-key": privateKey,
      ...((init.headers as Record<string, string> | undefined) ?? {}),
    },
  })
  const text = await res.text()
  let json: unknown = {}
  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    json = { raw: text }
  }
  const env = json as Envelope<T>
  if (!res.ok || env?.result === "0") {
    const errMsg =
      env?.message ??
      (env?.data as { error?: string } | undefined)?.error ??
      `HTTP ${res.status}`
    throw new Error(errMsg)
  }
  return (env?.data ?? (json as T)) as T
}

export async function checkPincodeServiceability(
  pickup: number,
  delivery: number
): Promise<boolean> {
  const data = await shipmozoFetch<{ serviceable?: boolean }>(
    "/pincode-serviceability",
    {
      method: "POST",
      body: JSON.stringify({
        pickup_pincode: pickup,
        delivery_pincode: delivery,
      }),
    }
  )
  return data?.serviceable === true
}

export type CalculateRatesInput = {
  pickup_pincode: number
  delivery_pincode: number
  payment_type: "PREPAID" | "COD"
  shipment_type: "FORWARD" | "RETURN"
  order_amount: number
  type_of_package: string
  rov_type: string
  cod_amount?: string | number
  weight: number
  length: number
  width: number
  height: number
}

export async function calculateRates(
  input: CalculateRatesInput
): Promise<ShipmozoCourierRate[]> {
  const res = await shipmozoFetch<unknown>("/rate-calculator", {
    method: "POST",
    body: JSON.stringify({
      pickup_pincode: input.pickup_pincode,
      delivery_pincode: input.delivery_pincode,
      payment_type: input.payment_type,
      shipment_type: input.shipment_type,
      order_amount: input.order_amount,
      type_of_package: input.type_of_package,
      rov_type: input.rov_type,
      cod_amount: input.cod_amount ?? "",
      weight: input.weight,
      dimensions: [
        {
          no_of_box: "1",
          length: String(input.length),
          width: String(input.width),
          height: String(input.height),
        },
      ],
    }),
  })
  if (Array.isArray(res)) return res as ShipmozoCourierRate[]
  const obj = res as { data?: unknown; result?: unknown }
  if (Array.isArray(obj?.data)) return obj.data as ShipmozoCourierRate[]
  if (Array.isArray(obj?.result)) return obj.result as ShipmozoCourierRate[]
  return []
}

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { calculateRates } from "../_shipmozo-client"
import type { ShipmozoCourierRate } from "../../../../modules/shipmozo/types"

type CartLike = {
  id: string
  total?: number | string | null
  items?: Array<{
    quantity?: number | null
    unit_price?: number | string | null
    variant?: {
      weight?: number | null
      length?: number | null
      width?: number | null
      height?: number | null
    } | null
  }>
}

const sanitizePincode = (raw: unknown): number | null => {
  if (raw === null || raw === undefined) return null
  const digits = String(raw).replace(/\D/g, "")
  if (digits.length < 4) return null
  const n = Number(digits)
  return Number.isFinite(n) ? n : null
}

const toNumber = (v: unknown, fallback = 0): number => {
  if (v === null || v === undefined) return fallback
  if (typeof v === "number") return v
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function aggregateDims(cart: CartLike): {
  weight_g: number
  length_cm: number
  width_cm: number
  height_cm: number
  order_amount: number
} {
  const dw = Number(process.env.SHIPMOZO_DEFAULT_WEIGHT_G) || 500
  const dl = Number(process.env.SHIPMOZO_DEFAULT_LENGTH_CM) || 15
  const db = Number(process.env.SHIPMOZO_DEFAULT_BREADTH_CM) || 10
  const dh = Number(process.env.SHIPMOZO_DEFAULT_HEIGHT_CM) || 10

  let totalWeight = 0
  let maxL = 0
  let maxB = 0
  let totalH = 0
  let total = 0

  for (const it of cart.items ?? []) {
    const qty = toNumber(it.quantity, 1) || 1
    const v = it.variant ?? null
    const w = v?.weight && v.weight > 0 ? v.weight : dw
    const l = v?.length && v.length > 0 ? v.length : dl
    const b = v?.width && v.width > 0 ? v.width : db
    const h = v?.height && v.height > 0 ? v.height : dh
    totalWeight += w * qty
    maxL = Math.max(maxL, l)
    maxB = Math.max(maxB, b)
    totalH += h * qty
    total += toNumber(it.unit_price) * qty
  }

  const order_amount = toNumber(cart.total, total) || total

  return {
    weight_g: Math.max(1, Math.round(totalWeight || dw)),
    length_cm: Math.max(1, Math.round(maxL || dl)),
    width_cm: Math.max(1, Math.round(maxB || db)),
    height_cm: Math.max(1, Math.round(totalH || dh)),
    order_amount: Math.round(order_amount * 100) / 100,
  }
}

function priceOf(r: ShipmozoCourierRate): number | undefined {
  const raw = r.total_charges ?? r.rate ?? r.freight_charges
  if (raw === undefined || raw === null) return undefined
  const n = typeof raw === "number" ? raw : Number(raw)
  return Number.isFinite(n) ? n : undefined
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const delivery = sanitizePincode(req.query.pincode)
  if (!delivery) {
    res.status(400).json({ error: "Invalid `pincode` query param" })
    return
  }
  const cartId =
    typeof req.query.cart_id === "string" ? req.query.cart_id : null
  if (!cartId) {
    res.status(400).json({ error: "Missing `cart_id` query param" })
    return
  }
  const pickup = sanitizePincode(process.env.SHIPMOZO_WAREHOUSE_PINCODE)
  if (!pickup) {
    res.status(503).json({
      error: "Origin pincode is not configured on the server",
    })
    return
  }

  const paymentType =
    String(req.query.payment_type ?? "PREPAID").toUpperCase() === "COD"
      ? "COD"
      : "PREPAID"

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  let cart: CartLike | undefined
  try {
    const { data } = await query.graph({
      entity: "cart",
      fields: [
        "id",
        "total",
        "items.quantity",
        "items.unit_price",
        "items.variant.weight",
        "items.variant.length",
        "items.variant.width",
        "items.variant.height",
      ],
      filters: { id: cartId },
    })
    cart = data?.[0] as CartLike | undefined
  } catch (e) {
    res.status(502).json({ error: (e as Error).message })
    return
  }

  if (!cart) {
    res.status(404).json({ error: "Cart not found" })
    return
  }

  const dims = aggregateDims(cart)

  try {
    const rates = await calculateRates({
      pickup_pincode: pickup,
      delivery_pincode: delivery,
      payment_type: paymentType,
      shipment_type: "FORWARD",
      order_amount: dims.order_amount,
      type_of_package: process.env.SHIPMOZO_PACKAGE_TYPE ?? "SPS",
      rov_type: process.env.SHIPMOZO_ROV_TYPE ?? "ROV_OWNER",
      cod_amount: paymentType === "COD" ? dims.order_amount : "",
      weight: dims.weight_g,
      length: dims.length_cm,
      width: dims.width_cm,
      height: dims.height_cm,
    })

    let best: { rate: ShipmozoCourierRate; price: number } | undefined
    for (const r of rates) {
      const p = priceOf(r)
      if (p === undefined) continue
      if (!best || p < best.price) best = { rate: r, price: p }
    }

    if (!best) {
      res.json({
        serviceable: false,
        error: "No courier is available for this destination",
      })
      return
    }

    res.json({
      serviceable: true,
      pickup_pincode: pickup,
      delivery_pincode: delivery,
      currency: "INR",
      amount: Math.round(best.price * 100) / 100,
      courier_name:
        best.rate.courier_name ?? best.rate.courier_company ?? null,
      expected_delivery_days:
        best.rate.expected_delivery_days ??
        best.rate.estimated_delivery_days ??
        null,
    })
  } catch (e) {
    res.status(502).json({
      serviceable: false,
      error: (e as Error).message || "Shipmozo rate-calculator failed",
    })
  }
}

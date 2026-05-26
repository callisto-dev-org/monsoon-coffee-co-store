import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { checkPincodeServiceability } from "../_shipmozo-client"

const sanitizePincode = (raw: unknown): number | null => {
  if (raw === null || raw === undefined) return null
  const digits = String(raw).replace(/\D/g, "")
  if (digits.length < 4) return null
  const n = Number(digits)
  return Number.isFinite(n) ? n : null
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const delivery = sanitizePincode(req.query.pincode)
  if (!delivery) {
    res
      .status(400)
      .json({ serviceable: false, error: "Invalid `pincode` query param" })
    return
  }

  const pickup = sanitizePincode(process.env.SHIPMOZO_WAREHOUSE_PINCODE)
  if (!pickup) {
    res.status(503).json({
      serviceable: false,
      error: "Origin pincode is not configured on the server",
    })
    return
  }

  try {
    const serviceable = await checkPincodeServiceability(pickup, delivery)
    res.json({ serviceable, pickup_pincode: pickup, delivery_pincode: delivery })
  } catch (e) {
    res.status(502).json({
      serviceable: false,
      error: (e as Error).message || "Shipmozo serviceability check failed",
    })
  }
}

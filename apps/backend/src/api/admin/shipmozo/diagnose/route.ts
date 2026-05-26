import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /admin/shipmozo/diagnose
 *
 * One-shot health check for the Shipmozo integration. Reports:
 *   - Whether Shipmozo env vars are present
 *   - Every shipping option in the store with its provider_id + data.id
 *   - Which ones the auto-fulfill subscriber would treat as "Shipmozo"
 *
 * Use this when an order didn't auto-fulfill and you want to know why.
 */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const envHealth = {
    public_key_set: !!process.env.SHIPMOZO_PUBLIC_KEY,
    private_key_set: !!process.env.SHIPMOZO_PRIVATE_KEY,
    warehouse_id_set: !!process.env.SHIPMOZO_WAREHOUSE_ID,
    warehouse_pincode_set: !!process.env.SHIPMOZO_WAREHOUSE_PINCODE,
    default_courier_id_set: !!process.env.SHIPMOZO_DEFAULT_COURIER_ID,
    cod_payment_provider_ids: process.env.SHIPMOZO_COD_PAYMENT_PROVIDER_IDS
      ? process.env.SHIPMOZO_COD_PAYMENT_PROVIDER_IDS.split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
  }

  type Row = {
    id?: string
    name?: string
    provider_id?: string | null
    data?: Record<string, unknown> | null
  }

  let options: Row[] = []
  try {
    const { data } = await query.graph({
      entity: "shipping_option",
      fields: ["id", "name", "provider_id", "data"],
      pagination: { take: 200 },
    })
    options = (data ?? []) as Row[]
  } catch (e) {
    res.status(500).json({
      env: envHealth,
      shipping_options: [],
      error: `Failed to load shipping options: ${(e as Error).message}`,
    })
    return
  }

  const summarized = options.map((o) => {
    const providerId = (o.provider_id ?? "").toLowerCase()
    const dataId = String(
      (o.data as { id?: unknown } | null | undefined)?.id ?? ""
    ).toLowerCase()
    const isShipmozo =
      providerId.includes("shipmozo") || dataId.startsWith("shipmozo-")
    return {
      id: o.id,
      name: o.name,
      provider_id: o.provider_id,
      data_id: (o.data as { id?: string } | null | undefined)?.id ?? null,
      treated_as_shipmozo: isShipmozo,
    }
  })

  const shipmozoCount = summarized.filter((o) => o.treated_as_shipmozo).length

  res.json({
    env: envHealth,
    summary: {
      total_shipping_options: summarized.length,
      shipmozo_shipping_options: shipmozoCount,
      ready:
        envHealth.public_key_set &&
        envHealth.private_key_set &&
        envHealth.warehouse_pincode_set &&
        shipmozoCount > 0,
    },
    shipping_options: summarized,
    next_steps:
      shipmozoCount === 0
        ? [
            "Open Settings → Locations & Shipping in admin.",
            "For each Shipping Profile, add a Shipping Option whose Fulfillment Provider is 'Shipmozo'.",
            "Pick 'shipmozo-forward' as the fulfillment option, Calculated price type.",
            "Save, then place a fresh test order so the cart picks the new option.",
          ]
        : !envHealth.public_key_set || !envHealth.private_key_set
        ? [
            "Set SHIPMOZO_PUBLIC_KEY and SHIPMOZO_PRIVATE_KEY in apps/backend/.env, then restart.",
          ]
        : !envHealth.warehouse_pincode_set
        ? [
            "Set SHIPMOZO_WAREHOUSE_PINCODE in apps/backend/.env (used to quote and book shipments).",
          ]
        : ["Configuration looks good. Place a test order to verify."],
  })
}

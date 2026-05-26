import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import type { ShipmozoFulfillmentData } from "../../../../../modules/shipmozo/types"

type FulfillmentRow = {
  id?: string
  provider_id?: string | null
  packed_at?: string | null
  shipped_at?: string | null
  delivered_at?: string | null
  canceled_at?: string | null
  created_at?: string | null
  data?: Record<string, unknown> | null
  labels?: Array<{
    tracking_number?: string | null
    tracking_url?: string | null
    label_url?: string | null
  }>
}

type OrderRow = {
  id?: string
  customer_id?: string | null
  fulfillments?: FulfillmentRow[]
}

export type StoreOrderTrackingResponse = {
  has_tracking: boolean
  shipments: Array<{
    fulfillment_id: string
    provider_id: string | null
    awb_number: string | null
    courier: string | null
    tracking_number: string | null
    tracking_url: string | null
    delivery_partner_name: string | null
    delivery_partner_phone: string | null
    shipment_type: string | null
    current_status: string | null
    status_time: string | null
    expected_delivery_date: string | null
    packed_at: string | null
    shipped_at: string | null
    delivered_at: string | null
    canceled_at: string | null
    scan_history: Array<{
      date: string | null
      status: string | null
      location: string | null
      remarks: string | null
    }>
  }>
}

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<StoreOrderTrackingResponse>
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { id } = req.params

  const { data } = await query.graph({
    entity: "order",
    filters: { id },
    fields: [
      "id",
      "customer_id",
      "fulfillments.id",
      "fulfillments.provider_id",
      "fulfillments.packed_at",
      "fulfillments.shipped_at",
      "fulfillments.delivered_at",
      "fulfillments.canceled_at",
      "fulfillments.created_at",
      "fulfillments.data",
      "fulfillments.labels.tracking_number",
      "fulfillments.labels.tracking_url",
      "fulfillments.labels.label_url",
    ],
    pagination: { take: 1 },
  })

  const order = data?.[0] as OrderRow | undefined

  if (!order) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Order not found")
  }
  if (order.customer_id !== req.auth_context.actor_id) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "You don't have permission to view this order"
    )
  }

  const shipments: StoreOrderTrackingResponse["shipments"] = (
    order.fulfillments ?? []
  ).map((f) => {
    const sm = ((f.data as { shipmozo?: ShipmozoFulfillmentData } | null | undefined)
      ?.shipmozo ?? {}) as Partial<ShipmozoFulfillmentData>
    const firstLabel = (f.labels ?? [])[0]
    return {
      fulfillment_id: f.id ?? "",
      provider_id: f.provider_id ?? null,
      awb_number: sm.awb_number ?? firstLabel?.tracking_number ?? null,
      courier: sm.courier ?? null,
      tracking_number:
        firstLabel?.tracking_number ?? sm.awb_number ?? null,
      tracking_url: firstLabel?.tracking_url || sm.tracking_url || null,
      delivery_partner_name: sm.delivery_partner_name ?? null,
      delivery_partner_phone: sm.delivery_partner_phone ?? null,
      shipment_type: sm.shipment_type ?? null,
      current_status: sm.current_status ?? null,
      status_time: sm.status_time ?? null,
      expected_delivery_date: sm.expected_delivery_date ?? null,
      packed_at: f.packed_at ?? null,
      shipped_at: f.shipped_at ?? null,
      delivered_at: f.delivered_at ?? null,
      canceled_at: f.canceled_at ?? null,
      scan_history: (sm.scan_history ?? []).map((s) => ({
        date: s?.date ?? null,
        status: s?.status ?? null,
        location: s?.location ?? null,
        remarks: s?.remarks ?? null,
      })),
    }
  })

  res.status(200).json({
    has_tracking: shipments.some(
      (s) =>
        s.awb_number ||
        s.tracking_number ||
        s.shipped_at ||
        s.delivered_at ||
        s.current_status
    ),
    shipments,
  })
}

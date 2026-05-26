"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { revalidateTag } from "next/cache"
import { getAuthHeaders, getCacheOptions, getCacheTag } from "./cookies"
import { HttpTypes } from "@medusajs/types"

export const retrieveOrder = async (id: string) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("orders")),
  }

  return sdk.client
    .fetch<HttpTypes.StoreOrderResponse>(`/store/orders/${id}`, {
      method: "GET",
      query: {
        fields:
          "*payment_collections.payments,*items,*items.metadata,*items.variant,*items.product",
      },
      headers,
      next,
      cache: "force-cache",
    })
    .then(({ order }) => order)
    .catch((err) => medusaError(err))
}

export const listOrders = async (
  limit: number = 10,
  offset: number = 0,
  filters?: Record<string, unknown>
) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("orders")),
  }

  return sdk.client
    .fetch<HttpTypes.StoreOrderListResponse>(`/store/orders`, {
      method: "GET",
      query: {
        limit,
        offset,
        order: "-created_at",
        fields: "*items,+items.metadata,*items.variant,*items.product",
        ...filters,
      },
      headers,
      next,
      cache: "force-cache",
    })
    .then(({ orders }) => orders)
    .catch((err) => medusaError(err))
}

export const createTransferRequest = async (
  state: {
    success: boolean
    error: string | null
    order: HttpTypes.StoreOrder | null
  },
  formData: FormData
): Promise<{
  success: boolean
  error: string | null
  order: HttpTypes.StoreOrder | null
}> => {
  const id = formData.get("order_id") as string

  if (!id) {
    return { success: false, error: "Order ID is required", order: null }
  }

  const headers = await getAuthHeaders()

  return await sdk.store.order
    .requestTransfer(
      id,
      {},
      {
        fields: "id, email",
      },
      headers
    )
    .then(({ order }) => ({ success: true, error: null, order }))
    .catch((err) => ({ success: false, error: err.message, order: null }))
}

export const acceptTransferRequest = async (id: string, token: string) => {
  const headers = await getAuthHeaders()

  return await sdk.store.order
    .acceptTransfer(id, { token }, {}, headers)
    .then(({ order }) => ({ success: true, error: null, order }))
    .catch((err) => ({ success: false, error: err.message, order: null }))
}

export const cancelOrder = async (
  id: string
): Promise<{ success: boolean; error: string | null }> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  try {
    await sdk.client.fetch(`/store/orders/${id}/cancel`, {
      method: "POST",
      headers,
    })

    
    const ordersCacheTag = await getCacheTag("orders")
    revalidateTag(ordersCacheTag)

    return { success: true, error: null }
  } catch (err) {
    console.error("Error canceling order:", err)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unable to cancel order",
    }
  }
}

export const requestOrderRefund = async (
  id: string,
  note?: string
): Promise<{ success: boolean; error: string | null }> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  try {
    await sdk.client.fetch(`/store/orders/${id}/refund`, {
      method: "POST",
      headers,
      body: note ? { note } : {},
    })

    const ordersCacheTag = await getCacheTag("orders")
    revalidateTag(ordersCacheTag)

    return { success: true, error: null }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unable to refund order",
    }
  }
}

export const declineTransferRequest = async (id: string, token: string) => {
  const headers = await getAuthHeaders()

  return await sdk.store.order
    .declineTransfer(id, { token }, {}, headers)
    .then(({ order }) => ({ success: true, error: null, order }))
    .catch((err) => ({ success: false, error: err.message, order: null }))
}

export type OrderTrackingScan = {
  date: string | null
  status: string | null
  location: string | null
  remarks: string | null
}

export type OrderTrackingShipment = {
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
  scan_history: OrderTrackingScan[]
}

export type OrderTrackingResponse = {
  has_tracking: boolean
  shipments: OrderTrackingShipment[]
}

export const retrieveOrderTracking = async (
  id: string
): Promise<OrderTrackingResponse | null> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions(`order-tracking-${id}`)),
    // Tracking changes frequently while a parcel is moving — give the
    // server response a short revalidation window so updates surface fast.
    revalidate: 60,
  }

  return sdk.client
    .fetch<OrderTrackingResponse>(`/store/orders/${id}/tracking`, {
      method: "GET",
      headers,
      next,
      cache: "force-cache",
    })
    .catch(() => null)
}

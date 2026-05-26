export const FulfillmentProviderKeys = {
  SHIPMOZO: "shipmozo",
} as const

export type ShipmozoEnv = "sandbox" | "production"

// Shipmozo expects uppercase for these enum-ish fields.
export type ShipmozoPaymentType = "PREPAID" | "COD"
export type ShipmozoShipmentType = "FORWARD" | "RETURN"
export type ShipmozoPackageType = "SPS" | string
export type ShipmozoRovType = "ROV_OWNER" | "ROV_SHIPMOZO" | string

export type ShipmozoOptions = {
  /** Sent as the `public-key` request header. */
  public_key: string
  /** Sent as the `private-key` request header. */
  private_key: string
  /** "sandbox" or "production". Both currently resolve to the same base URL. */
  environment?: ShipmozoEnv
  /**
   * Warehouse id from the Shipmozo panel (Settings → Warehouses, or via
   * /get-warehouses). Used as `warehouse_id` on /push-order to identify
   * which of your pickup locations ships the order. Optional — if omitted,
   * Shipmozo will use the account's default warehouse.
   */
  warehouse_id?: string | number
  /** Origin pincode used by /rate-calculator at checkout. */
  warehouse_pincode?: string
  /**
   * Optional: prefer this courier id from /rate-calculator when picking
   * the cheapest serviceable rate at checkout. Courier assignment for the
   * pushed order is performed by the operator in the Shipmozo panel.
   */
  default_courier_id?: string | number
  /** type_of_package field on /rate-calculator. Defaults to "SPS". */
  default_package_type?: ShipmozoPackageType
  /** rov_type field on /rate-calculator. Defaults to "ROV_OWNER". */
  default_rov_type?: ShipmozoRovType
  /**
   * Default return_reason_id sent to /push-return-order. Look up with
   * /get-return-reason (e.g. 9 = "Item is damaged", 14 = "Other").
   */
  default_return_reason_id?: number
  /** Default package weight (grams) when a variant has no weight set. */
  default_weight_g?: number
  /** Default package dimensions (cm) when variants have none. */
  default_length_cm?: number
  default_breadth_cm?: number
  default_height_cm?: number
  /**
   * Optional public tracking URL pattern. Use `{awb}` as placeholder. The
   * resolved URL is stored on the Fulfillment label so the admin can open
   * tracking with one click. Example:
   *   "https://shipmozo.com/tracking/{awb}"
   */
  tracking_url_template?: string
  /**
   * Payment provider IDs (from Medusa's payment module) that should be
   * treated as Cash-on-Delivery when pushing the order to Shipmozo. Match
   * is case-insensitive and exact. When unset, any provider id containing
   * "cod", "cash_on_delivery" or "cash-on-delivery" is treated as COD.
   */
  cod_payment_provider_ids?: string[]
}

// All Shipmozo responses look like { result: "1"|"0", message, data }.
export type ShipmozoEnvelope<T> = {
  result: "1" | "0" | string
  message?: string
  data?: T
}

// ─── Rate calculator ─────────────────────────────────────────────────────
export type ShipmozoRateRequest = {
  order_id?: string
  pickup_pincode: number
  delivery_pincode: number
  payment_type: ShipmozoPaymentType
  shipment_type: ShipmozoShipmentType
  order_amount: number
  type_of_package: ShipmozoPackageType
  rov_type: ShipmozoRovType
  cod_amount?: string | number
  weight: number
  dimensions: Array<{
    no_of_box: string | number
    length: string | number
    width: string | number
    height: string | number
  }>
}

// The PDF doesn't enumerate response fields for rate-calculator, so we keep
// the shape permissive and probe for the price under several common keys.
export type ShipmozoCourierRate = {
  courier_id?: string | number
  courier_name?: string
  courier_company?: string
  total_charges?: number | string
  freight_charges?: number | string
  cod_charges?: number | string
  expected_delivery_days?: number | string
  estimated_delivery_days?: number | string
  pickups_automatically_scheduled?: "YES" | "NO" | string
  rate?: number | string
  [k: string]: unknown
}

// ─── Push order ──────────────────────────────────────────────────────────
export type ShipmozoPushOrderRequest = {
  order_id: string
  order_date: string
  order_type?: string
  consignee_name: string
  consignee_phone: number
  consignee_alternate_phone?: number
  consignee_email?: string
  consignee_address_line_one: string
  consignee_address_line_two?: string
  consignee_pin_code: number
  consignee_city: string
  consignee_state: string
  product_detail: Array<{
    name: string
    sku_number?: string
    quantity: number
    discount?: string | number
    hsn?: string
    unit_price: number
    product_category?: string
  }>
  payment_type: ShipmozoPaymentType
  cod_amount?: string | number
  weight: number
  length: number
  width: number
  height: number
  warehouse_id?: string | number
  gst_ewaybill_number?: string
  gstin_number?: string
}

export type ShipmozoPushOrderResult = {
  Info?: string
  order_id?: string
  reference_id?: string
}

// ─── Cancel ──────────────────────────────────────────────────────────────
export type ShipmozoCancelResult = {
  order_id?: string
  reference_id?: string
}

// ─── Track ───────────────────────────────────────────────────────────────
export type ShipmozoTrackResult = {
  order_id?: string
  reference_id?: string
  awb_number?: string
  courier?: string
  expected_delivery_date?: string | null
  current_status?: string
  status_time?: string | null
  scan_detail?: Array<{
    status?: string
    location?: string
    date?: string
    remarks?: string
  }>
}

// ─── Label ───────────────────────────────────────────────────────────────
export type ShipmozoLabelEntry = {
  label?: string
  created_at?: string
}

// ─── Pincode serviceability ──────────────────────────────────────────────
export type ShipmozoServiceabilityResult = {
  serviceable?: boolean
}

// Data stored on the fulfillment after createFulfillment() and progressively
// enriched by the Shipmozo status webhook. Kept here so cancelFulfillment /
// getFulfillmentDocuments / the storefront tracking endpoint can read it
// back type-safely.
export type ShipmozoScan = {
  date?: string
  status?: string
  location?: string
  remarks?: string
}

export type ShipmozoFulfillmentData = {
  order_id: string
  awb_number?: string
  lr_number?: string
  courier?: string
  reference_id?: string
  label_url?: string
  tracking_url?: string
  // Webhook-populated fields
  delivery_partner_name?: string
  delivery_partner_phone?: string
  expected_delivery_date?: string
  shipment_type?: string
  current_status?: string
  status_time?: string
  scan_history?: ShipmozoScan[]
}

// Shape of the status-update webhook Shipmozo posts when a shipment changes
// state. Field names mirror the wire payload — including Shipmozo's typo of
// "refrence_id" and "delhivery_*".
export type ShipmozoWebhookPayload = {
  order_id?: string
  refrence_id?: string
  reference_id?: string
  awb_number?: string
  carrier?: string
  delhivery_name?: string
  delhivery_phone?: string
  delivery_name?: string
  delivery_phone?: string
  expected_delivery_date?: string
  shipment_type?: string
  current_status?: string
  status_time?: string
  status_feed?: { scan?: ShipmozoScan[] }
}

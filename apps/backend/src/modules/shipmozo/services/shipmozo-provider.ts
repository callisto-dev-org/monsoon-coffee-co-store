import {
  AbstractFulfillmentProviderService,
  MedusaError,
  isDefined,
} from "@medusajs/framework/utils"
import {
  CalculatedShippingOptionPrice,
  CalculateShippingOptionPriceContext,
  CreateFulfillmentResult,
  CreateShippingOptionDTO,
  FulfillmentDTO,
  FulfillmentItemDTO,
  FulfillmentOption,
  FulfillmentOrderDTO,
  Logger,
  ValidateFulfillmentDataContext,
} from "@medusajs/framework/types"

import {
  FulfillmentProviderKeys,
  ShipmozoCancelResult,
  ShipmozoCourierRate,
  ShipmozoEnvelope,
  ShipmozoFulfillmentData,
  ShipmozoLabelEntry,
  ShipmozoOptions,
  ShipmozoPaymentType,
  ShipmozoPushOrderRequest,
  ShipmozoPushOrderResult,
  ShipmozoServiceabilityResult,
  ShipmozoTrackResult,
} from "../types"
import {
  digitsToNumber,
  formatOrderDate,
  pickCheapestRate,
  ratePrice,
  round2,
  toMajorUnits,
} from "../utils"

type InjectedDependencies = {
  logger: Logger
}

// Shipmozo serves a single endpoint for both environments — the keys
// determine which account/data is hit. The split is kept for symmetry in case
// a staging URL is added in future.
const BASE_URLS: Record<"sandbox" | "production", string> = {
  sandbox: "https://shipping-api.com/app/api/v1",
  production: "https://shipping-api.com/app/api/v1",
}

class ShipmozoProviderService extends AbstractFulfillmentProviderService {
  static identifier = FulfillmentProviderKeys.SHIPMOZO

  protected readonly logger_: Logger
  protected readonly options_: ShipmozoOptions
  protected readonly baseUrl_: string

  static validateOptions(options: Record<string, unknown>): void | never {
    if (!isDefined(options.public_key) || !isDefined(options.private_key)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Shipmozo provider requires `public_key` and `private_key` options."
      )
    }
  }

  constructor(container: InjectedDependencies, options: ShipmozoOptions) {
    super()
    this.logger_ = container.logger
    this.options_ = options
    this.baseUrl_ = BASE_URLS[options.environment ?? "sandbox"]
  }

  // ──────────────────────────────────────────────────────────────────────
  // Shipping options surfaced to the admin when configuring a Shipping
  // Option. Each entry shows up in the "Fulfillment Option" dropdown.
  // ──────────────────────────────────────────────────────────────────────
  async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
    // A single forward option: PREPAID vs COD is derived at quote/booking
    // time from the cart's (or order's) active payment session. Admin
    // therefore only configures one shipping option per region/profile.
    return [
      {
        id: "shipmozo-forward",
        name: "Shipmozo — Delivery (auto PREPAID / COD)",
      },
      {
        id: "shipmozo-return",
        name: "Shipmozo — Return pickup",
        is_return: true,
      },
    ]
  }

  async validateOption(data: Record<string, unknown>): Promise<boolean> {
    return (
      typeof data?.id === "string" &&
      (data.id as string).startsWith("shipmozo-")
    )
  }

  async validateFulfillmentData(
    optionData: Record<string, unknown>,
    data: Record<string, unknown>,
    _context: ValidateFulfillmentDataContext
  ): Promise<Record<string, unknown>> {
    // payment_type is no longer baked into shipping option data — it is
    // resolved dynamically from the cart's payment session.
    return {
      ...data,
      option_id: optionData?.id,
    }
  }

  async canCalculate(_data: CreateShippingOptionDTO): Promise<boolean> {
    return true
  }

  // ──────────────────────────────────────────────────────────────────────
  // Live rate quote — called every time the cart's shipping method is
  // refreshed at checkout.
  // ──────────────────────────────────────────────────────────────────────
  async calculatePrice(
    optionData: Record<string, unknown>,
    data: Record<string, unknown>,
    context: CalculateShippingOptionPriceContext
  ): Promise<CalculatedShippingOptionPrice> {
    const cart = context as CalculateShippingOptionPriceContext & {
      id?: string
      shipping_address?: { postal_code?: string | null } | null
      items?: Array<{
        quantity?: number | string
        variant?: {
          weight?: number | null
          length?: number | null
          height?: number | null
          width?: number | null
        } | null
        unit_price?: unknown
      }>
      total?: unknown
      metadata?: Record<string, unknown> | null
    }

    const toPincode = digitsToNumber(cart.shipping_address?.postal_code)
    if (!toPincode) {
      throw this.buildError(
        "Cannot quote shipping",
        new Error("Cart has no valid shipping address pincode")
      )
    }

    const fromPincode = digitsToNumber(this.options_.warehouse_pincode)
    if (!fromPincode) {
      throw this.buildError(
        "Cannot quote shipping",
        new Error(
          "SHIPMOZO_WAREHOUSE_PINCODE is not configured for the Shipmozo provider"
        )
      )
    }

    const dims = this.aggregatePackageDimensions(cart.items ?? [])

    // Order of precedence: explicit data.payment_type (set by the
    // storefront on the shipping method) → cart.metadata.shipmozo_payment_type
    // → default PREPAID.
    const paymentType: ShipmozoPaymentType = this.extractPaymentType([
      data,
      optionData,
      cart.metadata
        ? {
            payment_type:
              cart.metadata["shipmozo_payment_type"] ??
              cart.metadata["payment_type"],
          }
        : null,
    ])

    const orderAmount = round2(
      toMajorUnits(cart.total) ||
        (cart.items ?? []).reduce(
          (sum, i) =>
            sum + toMajorUnits(i.unit_price) * Number(i.quantity ?? 1),
          0
        )
    )

    const rates = await this.fetchRates({
      pickup_pincode: fromPincode,
      delivery_pincode: toPincode,
      payment_type: paymentType,
      shipment_type: "FORWARD",
      order_amount: orderAmount,
      type_of_package: this.options_.default_package_type ?? "SPS",
      rov_type: this.options_.default_rov_type ?? "ROV_OWNER",
      cod_amount: paymentType === "COD" ? orderAmount : "",
      weight: dims.weight_g,
      dimensions: [
        {
          no_of_box: "1",
          length: dims.length_cm,
          width: dims.breadth_cm,
          height: dims.height_cm,
        },
      ],
    })

    const cheapest = pickCheapestRate(rates, this.options_.default_courier_id)
    if (!cheapest) {
      throw this.buildError(
        "No Shipmozo courier serviceable for this destination",
        new Error(`from=${fromPincode} to=${toPincode}`)
      )
    }

    return {
      calculated_amount: round2(ratePrice(cheapest)),
      // Shipmozo's quoted charges include GST on the merchant invoice.
      is_calculated_price_tax_inclusive: true,
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // Fulfillment lifecycle
  //
  // We only register the order with Shipmozo via /push-order. Courier
  // assignment and pickup scheduling are handled by the operator from the
  // Shipmozo panel — no AWB or label is issued at this stage.
  // ──────────────────────────────────────────────────────────────────────
  async createFulfillment(
    data: Record<string, unknown>,
    items: Partial<Omit<FulfillmentItemDTO, "fulfillment">>[],
    order: Partial<FulfillmentOrderDTO> | undefined,
    fulfillment: Partial<Omit<FulfillmentDTO, "provider_id" | "data" | "items">>
  ): Promise<CreateFulfillmentResult> {
    const address = (fulfillment as { delivery_address?: Record<string, unknown> })
      .delivery_address as
      | {
          first_name?: string
          last_name?: string
          phone?: string
          address_1?: string
          address_2?: string
          city?: string
          province?: string
          postal_code?: string
          country_code?: string
        }
      | undefined

    if (!address?.postal_code) {
      throw this.buildError(
        "Cannot create Shipmozo shipment",
        new Error("Fulfillment is missing a delivery address pincode")
      )
    }

    // Shipmozo's backend treats bare short numeric strings as internal
    // entity IDs. Always prefix with a tag so the value is unambiguous.
    const displayId =
      order?.display_id ?? (order as { id?: string } | undefined)?.id
    const orderRef = displayId
      ? `mc_${String(displayId)}`
      : `mc_${fulfillment.id ?? Date.now()}`

    const dims = this.aggregatePackageDimensions(
      (items ?? []).map((it) => ({
        quantity: it.quantity ? Number(it.quantity) : 1,
      }))
    )

    const orderMetadata = (order as { metadata?: Record<string, unknown> } | undefined)
      ?.metadata
    const fulfillmentMetadata = (
      fulfillment as { metadata?: Record<string, unknown> }
    )?.metadata
    const paymentType: ShipmozoPaymentType = this.extractPaymentType([
      fulfillmentMetadata,
      data,
      orderMetadata
        ? {
            payment_type:
              orderMetadata["shipmozo_payment_type"] ??
              orderMetadata["payment_type"],
          }
        : null,
    ])

    // Build a unit-price lookup from the order's line items. FulfillmentItem
    // DTOs don't carry unit_price — Shipmozo rejects /push-order if any
    // product_detail entry has unit_price <= 0, so we MUST resolve it from
    // the parent order's line items via `line_item_id`.
    const orderLineItems =
      (order as { items?: Array<{ id?: string; unit_price?: unknown }> } | undefined)?.items ??
      []
    const unitPriceByLineItemId = new Map<string, number>()
    for (const li of orderLineItems) {
      if (li?.id) {
        unitPriceByLineItemId.set(
          li.id,
          round2(toMajorUnits(li.unit_price))
        )
      }
    }

    const resolveUnitPrice = (it: { line_item_id?: string; unit_price?: unknown }): number => {
      const fromOrder = it.line_item_id
        ? unitPriceByLineItemId.get(it.line_item_id) ?? 0
        : 0
      if (fromOrder > 0) return fromOrder
      const fromItem = round2(toMajorUnits(it.unit_price))
      if (fromItem > 0) return fromItem
      // Last resort: Shipmozo rejects 0 / negative. Use 1 paisa so the push
      // succeeds — the operator should set a real price on the variant.
      return 0.01
    }

    const orderAmount = round2(
      toMajorUnits((order as { total?: unknown } | undefined)?.total) ||
        (items ?? []).reduce(
          (sum, it) =>
            sum +
            resolveUnitPrice(it as { line_item_id?: string; unit_price?: unknown }) *
              (it.quantity ? Number(it.quantity) : 1),
          0
        )
    )

    const customerEmail = (order as { email?: string } | undefined)?.email
    const fullName = [address.first_name, address.last_name]
      .filter(Boolean)
      .join(" ")
      .trim()

    const consigneePhone = digitsToNumber(address.phone)
    // Optional alt phone — Shipmozo requires it to be *different* from the
    // main phone when present. We only include it if the customer actually
    // entered a distinct one on the address (none of our flows do today, so
    // this is effectively always undefined).
    const altPhoneRaw = (address as { alternate_phone?: string }).alternate_phone
    const altPhone = altPhoneRaw ? digitsToNumber(altPhoneRaw) : 0
    const includeAltPhone = altPhone > 0 && altPhone !== consigneePhone

    const payload: ShipmozoPushOrderRequest = {
      order_id: orderRef,
      order_date: formatOrderDate(),
      // Shipmozo's PHP backend throws "Undefined index" on several fields
      // when omitted, even though the docs mark them optional. Send empty
      // strings to keep the API happy.
      order_type: "ESSENTIALS",
      consignee_name: fullName || "Customer",
      consignee_phone: consigneePhone,
      ...(includeAltPhone ? { consignee_alternate_phone: altPhone } : {}),
      consignee_email: customerEmail ?? "",
      consignee_address_line_one: address.address_1 ?? "",
      consignee_address_line_two: address.address_2 ?? "",
      consignee_pin_code: digitsToNumber(address.postal_code),
      consignee_city: address.city ?? "",
      consignee_state: address.province ?? "",
      product_detail: (items ?? []).map((it) => ({
        name: it.title ?? "Item",
        sku_number:
          (it as { sku?: string }).sku ?? it.barcode ?? "",
        quantity: Number(it.quantity ?? 1),
        // Shipmozo's PHP backend reads these fields unconditionally even
        // though the docs mark them optional. Always send empty strings to
        // avoid an "Undefined index: <field>" error.
        discount: "",
        hsn: (it as { hs_code?: string }).hs_code ?? "",
        unit_price: resolveUnitPrice(
          it as { line_item_id?: string; unit_price?: unknown }
        ),
        product_category: "Other",
      })),
      payment_type: paymentType,
      cod_amount: paymentType === "COD" ? String(orderAmount) : "",
      weight: dims.weight_g,
      length: dims.length_cm,
      width: dims.breadth_cm,
      height: dims.height_cm,
      warehouse_id: this.options_.warehouse_id,
      gst_ewaybill_number: "",
      gstin_number: "",
    }

    // Push the order. Courier assignment and pickup scheduling happen in
    // the Shipmozo panel — we do not call /auto-assign-order or
    // /assign-courier here.
    const pushResult = await this.shipmozoRequest<ShipmozoPushOrderResult>(
      "/push-order",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    )
    const shipmozoOrderId =
      pushResult?.order_id ?? pushResult?.reference_id ?? orderRef
    this.logger_.info(
      `Shipmozo /push-order accepted order_ref=${orderRef} as shipmozo_order_id=${shipmozoOrderId}`
    )

    const fulfillmentData: ShipmozoFulfillmentData = {
      order_id: shipmozoOrderId,
      reference_id: pushResult?.reference_id,
    }

    return {
      data: {
        ...((fulfillment as { data?: Record<string, unknown> }).data ?? {}),
        shipmozo: fulfillmentData,
      },
      labels: [],
    }
  }

  async cancelFulfillment(data: Record<string, unknown>): Promise<unknown> {
    const meta = (data?.shipmozo as ShipmozoFulfillmentData | undefined) ?? {
      order_id: "",
    }
    if (!meta.order_id || !meta.awb_number) {
      // Nothing was registered with Shipmozo yet — nothing to cancel.
      return {}
    }

    try {
      return await this.shipmozoRequest<ShipmozoCancelResult>("/cancel-order", {
        method: "POST",
        body: JSON.stringify({
          order_id: meta.order_id,
          awb_number: digitsToNumber(meta.awb_number),
        }),
      })
    } catch (e) {
      // Don't block Medusa from cancelling the local fulfillment if Shipmozo
      // refuses (e.g. shipment already in transit). Surface a warning instead.
      this.logger_.warn(
        `Shipmozo cancel-order failed for AWB ${meta.awb_number}: ${(e as Error).message}`
      )
      return { warning: (e as Error).message }
    }
  }

  async createReturnFulfillment(
    fromData: Record<string, unknown>
  ): Promise<CreateFulfillmentResult> {
    // The fulfillment workflow passes the FORWARD shipment's `data` in
    // `fromData`. We use the customer's address from there as the pickup
    // address for the return.
    const original = fromData?.shipmozo as ShipmozoFulfillmentData | undefined
    const returnReasonId = this.options_.default_return_reason_id ?? 14 // "Other"
    const orderRef = original?.order_id
      ? `${original.order_id}_ret_${Date.now().toString(36)}`
      : `mc_ret_${Date.now().toString(36)}`

    // We don't have the cart context here, so we can only push a minimal
    // return order. The operator can edit it in the Shipmozo panel.
    const address = (fromData as {
      delivery_address?: {
        first_name?: string
        last_name?: string
        phone?: string
        address_1?: string
        address_2?: string
        city?: string
        province?: string
        postal_code?: string
      }
    }).delivery_address

    if (!address?.postal_code) {
      this.logger_.warn(
        "Shipmozo createReturnFulfillment: no delivery address on fulfillment — falling back to manual return."
      )
      return { data: { ...fromData, requires_manual_return: true }, labels: [] }
    }

    const fullName = [address.first_name, address.last_name]
      .filter(Boolean)
      .join(" ")
      .trim()

    const payload = {
      order_id: orderRef,
      order_date: formatOrderDate(),
      pickup_name: fullName || "Customer",
      pickup_phone: digitsToNumber(address.phone),
      pickup_address_line_one: address.address_1 ?? "",
      pickup_address_line_two: address.address_2 ?? undefined,
      pickup_pin_code: digitsToNumber(address.postal_code),
      pickup_city: address.city ?? "",
      pickup_state: address.province ?? "",
      product_detail: [
        {
          name: "Returned items",
          quantity: 1,
          unit_price: 0,
          product_category: "Other",
        },
      ],
      payment_type: "PREPAID" satisfies ShipmozoPaymentType,
      weight: this.options_.default_weight_g ?? 500,
      length: this.options_.default_length_cm ?? 15,
      width: this.options_.default_breadth_cm ?? 10,
      height: this.options_.default_height_cm ?? 10,
      warehouse_id: this.options_.warehouse_id,
      return_reason_id: returnReasonId,
      customer_request: "REFUND",
    }

    try {
      const result = await this.shipmozoRequest<ShipmozoPushOrderResult>(
        "/push-return-order",
        { method: "POST", body: JSON.stringify(payload) }
      )

      return {
        data: {
          ...fromData,
          shipmozo_return: {
            order_id: orderRef,
            reference_id: result.reference_id,
          },
        },
        labels: [],
      }
    } catch (e) {
      this.logger_.warn(
        `Shipmozo push-return-order failed for ${orderRef}: ${(e as Error).message}`
      )
      return { data: { ...fromData, requires_manual_return: true }, labels: [] }
    }
  }

  /**
   * Fetches the shipping label as a base64 PNG and exposes it as a data URL
   * so the admin can download it directly from the fulfillment page.
   */
  async getFulfillmentDocuments(
    data: Record<string, unknown>
  ): Promise<never[]> {
    const meta = data?.shipmozo as ShipmozoFulfillmentData | undefined
    if (!meta?.awb_number) return [] as never[]
    try {
      const labels = await this.shipmozoRequest<ShipmozoLabelEntry[]>(
        `/get-order-label/${encodeURIComponent(meta.awb_number)}`,
        { method: "GET" }
      )
      const entry = Array.isArray(labels) ? labels[0] : undefined
      if (!entry?.label) return [] as never[]
      const dataUrl = entry.label.startsWith("data:")
        ? entry.label
        : `data:image/png;base64,${entry.label}`
      return [
        {
          type: "label",
          url: dataUrl,
          created_at: entry.created_at,
        },
      ] as unknown as never[]
    } catch (e) {
      this.logger_.warn(
        `Shipmozo get-order-label failed for AWB ${meta.awb_number}: ${(e as Error).message}`
      )
      return [] as never[]
    }
  }

  /**
   * Convenience helper for callers (e.g. a tracking endpoint) — not part of
   * the AbstractFulfillmentProviderService interface but useful to expose.
   */
  async trackOrder(awbNumber: string): Promise<ShipmozoTrackResult> {
    return this.shipmozoRequest<ShipmozoTrackResult>(
      `/track-order?awb_number=${encodeURIComponent(awbNumber)}`,
      { method: "GET" }
    )
  }

  async checkPincodeServiceable(
    pickup: string | number,
    delivery: string | number
  ): Promise<boolean> {
    const res = await this.shipmozoRequest<ShipmozoServiceabilityResult>(
      "/pincode-serviceability",
      {
        method: "POST",
        body: JSON.stringify({
          pickup_pincode: Number(pickup),
          delivery_pincode: Number(delivery),
        }),
      }
    )
    return res?.serviceable === true
  }

  // ──────────────────────────────────────────────────────────────────────
  // Internals
  // ──────────────────────────────────────────────────────────────────────
  private async fetchRates(
    payload: {
      pickup_pincode: number
      delivery_pincode: number
      payment_type: ShipmozoPaymentType
      shipment_type: "FORWARD" | "RETURN"
      order_amount: number
      type_of_package: string
      rov_type: string
      cod_amount?: string | number
      weight: number
      dimensions: Array<{
        no_of_box: string | number
        length: string | number
        width: string | number
        height: string | number
      }>
    }
  ): Promise<ShipmozoCourierRate[]> {
    const res = await this.shipmozoRequest<unknown>("/rate-calculator", {
      method: "POST",
      body: JSON.stringify(payload),
    })

    // The PDF doesn't enumerate the response shape — be permissive: accept
    // either an array directly or one wrapped in `data` / `result`.
    if (Array.isArray(res)) return res as ShipmozoCourierRate[]
    const obj = (res as { data?: unknown; result?: unknown }) ?? {}
    if (Array.isArray(obj.data)) return obj.data as ShipmozoCourierRate[]
    if (Array.isArray(obj.result)) return obj.result as ShipmozoCourierRate[]
    return []
  }

  private async shipmozoRequest<T>(
    path: string,
    init: RequestInit = {}
  ): Promise<T> {
    const res = await fetch(`${this.baseUrl_}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "public-key": this.options_.public_key,
        "private-key": this.options_.private_key,
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

    const envelope = json as ShipmozoEnvelope<unknown>
    // Shipmozo signals failure with result === "0" (string) even on HTTP 200.
    if (!res.ok || envelope?.result === "0") {
      const detail = this.extractShipmozoErrorDetail(envelope, text, res.status)
      // Log the full envelope so devs can see exactly what Shipmozo rejected.
      this.logger_.error(
        `Shipmozo ${path} failed (HTTP ${res.status}). Body: ${text || "<empty>"}`
      )
      // Mirror the outgoing payload — many Shipmozo failures are bad input
      // (missing warehouse_id, malformed phone, etc.). Hide the keys.
      if (init?.body) {
        this.logger_.error(
          `Shipmozo ${path} request body: ${
            typeof init.body === "string" ? init.body : "<non-string body>"
          }`
        )
      }
      throw this.buildError(`Shipmozo API error (${path})`, new Error(detail))
    }

    // Unwrap envelope.data when present so callers can work with the inner
    // payload directly. Some endpoints (e.g. /get-order-label) return data
    // as an array — return it as-is.
    if (envelope && Object.prototype.hasOwnProperty.call(envelope, "data")) {
      return (envelope.data ?? {}) as T
    }
    return json as T
  }

  private extractShipmozoErrorDetail(
    envelope: ShipmozoEnvelope<unknown> | null | undefined,
    rawText: string,
    status: number
  ): string {
    const parts: string[] = []
    if (envelope?.message && envelope.message !== "Error") {
      parts.push(envelope.message)
    }
    const data = envelope?.data as
      | { error?: string; errors?: unknown; [k: string]: unknown }
      | undefined
    if (data) {
      if (typeof data.error === "string") parts.push(data.error)
      if (data.errors) parts.push(JSON.stringify(data.errors))
      // Some Shipmozo responses bury validation issues at the top level of
      // data — fold them all in so the operator can see field-level reasons.
      const otherKeys = Object.keys(data).filter(
        (k) => k !== "error" && k !== "errors"
      )
      if (otherKeys.length > 0) {
        const extras: Record<string, unknown> = {}
        for (const k of otherKeys) extras[k] = data[k]
        parts.push(JSON.stringify(extras))
      }
    }
    if (parts.length === 0) {
      parts.push(envelope?.message || rawText || `HTTP ${status}`)
    }
    return parts.join(" | ")
  }

  private buildTrackingUrl(awb: string | undefined): string | undefined {
    if (!awb || !this.options_.tracking_url_template) return undefined
    return this.options_.tracking_url_template.replace(/\{awb\}/g, awb)
  }

  /**
   * Aggregate per-item dimensions into a single package estimate.
   * Returns weight in **grams** and dimensions in **cm**, matching
   * the units Shipmozo's APIs expect.
   */
  private aggregatePackageDimensions(
    items: Array<{
      quantity?: number | string
      variant?: {
        weight?: number | null
        length?: number | null
        height?: number | null
        width?: number | null
      } | null
    }>
  ): {
    weight_g: number
    length_cm: number
    breadth_cm: number
    height_cm: number
  } {
    const dw = this.options_.default_weight_g ?? 500
    const dl = this.options_.default_length_cm ?? 15
    const db = this.options_.default_breadth_cm ?? 10
    const dh = this.options_.default_height_cm ?? 10

    let totalWeight = 0
    let maxL = 0
    let maxB = 0
    let totalH = 0

    for (const item of items) {
      const qty = Number(item.quantity ?? 1) || 1
      const v = item.variant ?? undefined
      // Medusa variant weights are stored as plain numbers; convention is
      // grams. We treat them as grams here.
      const itemWeight = (v?.weight && v.weight > 0 ? v.weight : dw) * qty
      const itemL = v?.length && v.length > 0 ? v.length : dl
      const itemB = v?.width && v.width > 0 ? v.width : db
      const itemH = (v?.height && v.height > 0 ? v.height : dh) * qty

      totalWeight += itemWeight
      maxL = Math.max(maxL, itemL)
      maxB = Math.max(maxB, itemB)
      totalH += itemH
    }

    return {
      weight_g: Math.max(1, Math.round(totalWeight || dw)),
      length_cm: Math.max(1, Math.round(maxL || dl)),
      breadth_cm: Math.max(1, Math.round(maxB || db)),
      height_cm: Math.max(1, Math.round(totalH || dh)),
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // Payment-type resolution
  //
  // The provider has no DB access (the fulfillment module's Awilix
  // container doesn't expose `query`). Instead, payment_type is forwarded
  // into the provider by the caller via `data.payment_type` or
  // `fulfillment.metadata.payment_type`. The auto-fulfill subscriber sets
  // this from the order's active payment session before invoking the
  // create-fulfillment workflow. Default is PREPAID when nothing is set.
  // ──────────────────────────────────────────────────────────────────────
  private extractPaymentType(
    sources: Array<Record<string, unknown> | null | undefined>
  ): ShipmozoPaymentType {
    for (const src of sources) {
      const raw = src?.payment_type ?? src?.["paymentType"]
      if (typeof raw === "string") {
        const upper = raw.toUpperCase()
        if (upper === "COD" || upper === "PREPAID") return upper
      }
    }
    return "PREPAID"
  }

  private buildError(message: string, error: unknown): Error {
    const detail =
      (error as { message?: string })?.message ??
      (typeof error === "string" ? error : "Unknown error")
    return new Error(`${message}: ${detail}`)
  }
}

export default ShipmozoProviderService

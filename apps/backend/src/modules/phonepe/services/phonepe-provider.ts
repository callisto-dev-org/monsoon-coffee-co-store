import crypto from "crypto"
import {
  AbstractPaymentProvider,
  BigNumber,
  MedusaError,
  PaymentActions,
  PaymentSessionStatus,
  isDefined,
} from "@medusajs/framework/utils"
import {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  Logger,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types"

import {
  PaymentProviderKeys,
  PhonePeOptions,
  PhonePeOrderState,
  PhonePeOrderStatusResponse,
  PhonePePayResponse,
} from "../types"
import { getAmountFromSmallestUnit, getSmallestUnit } from "../utils"

type InjectedDependencies = {
  logger: Logger
}

type CachedToken = {
  accessToken: string
  // Unix seconds at which the token expires.
  expiresAt: number
}

const BASE_URLS: Record<"sandbox" | "production", string> = {
  sandbox: "https://api-preprod.phonepe.com/apis/pg-sandbox",
  production: "https://api.phonepe.com/apis/pg",
}

class PhonePeProviderService extends AbstractPaymentProvider<PhonePeOptions> {
  static identifier = PaymentProviderKeys.PHONEPE

  protected readonly logger_: Logger
  protected readonly options_: PhonePeOptions
  protected readonly baseUrl_: string
  protected tokenCache_: CachedToken | null = null

  static validateOptions(options: Record<string, unknown>): void | never {
    if (
      !isDefined(options.client_id) ||
      !isDefined(options.client_secret) ||
      !isDefined(options.client_version)
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "PhonePe provider requires `client_id`, `client_secret`, and `client_version` options."
      )
    }
  }

  constructor(container: InjectedDependencies, options: PhonePeOptions) {
    // @ts-expect-error - matching the upstream AbstractPaymentProvider pattern
    super(...arguments)
    this.logger_ = container.logger
    this.options_ = options
    this.baseUrl_ = BASE_URLS[options.environment ?? "sandbox"]
  }

  private async getAccessToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000)
    if (this.tokenCache_ && this.tokenCache_.expiresAt - 30 > now) {
      return this.tokenCache_.accessToken
    }

    const body = new URLSearchParams({
      client_id: this.options_.client_id,
      client_version: String(this.options_.client_version),
      client_secret: this.options_.client_secret,
      grant_type: "client_credentials",
    })

    const res = await fetch(`${this.baseUrl_}/v1/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body,
    })

    const json = (await res.json().catch(() => ({}))) as {
      access_token?: string
      expires_at?: number
      expires_in?: number
      message?: string
      code?: string
    }

    if (!res.ok || !json.access_token) {
      throw this.buildError(
        "Failed to fetch PhonePe access token",
        new Error(json.message ?? json.code ?? `HTTP ${res.status}`)
      )
    }

    this.tokenCache_ = {
      accessToken: json.access_token,
      expiresAt:
        json.expires_at ??
        Math.floor(Date.now() / 1000) + (json.expires_in ?? 3600),
    }

    return this.tokenCache_.accessToken
  }

  private async authedFetch<T>(
    path: string,
    init: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAccessToken()
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `O-Bearer ${token}`,
      ...((init.headers as Record<string, string> | undefined) ?? {}),
    }
    const res = await fetch(`${this.baseUrl_}${path}`, { ...init, headers })
    const text = await res.text()
    let json: unknown = {}
    try {
      json = text ? JSON.parse(text) : {}
    } catch {
      json = { raw: text }
    }
    if (!res.ok) {
      const err = json as { message?: string; code?: string }
      throw this.buildError(
        `PhonePe API error (${res.status})`,
        new Error(err.message ?? err.code ?? (text || `HTTP ${res.status}`))
      )
    }
    return json as T
  }

  async initiatePayment(
    input: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    const { amount, currency_code, data, context } = input
    const sessionId =
      (data?.session_id as string | undefined) ??
      (context?.idempotency_key as string | undefined)

    // PhonePe only supports INR on the PG v2 sandbox/production endpoints.
    if (currency_code.toUpperCase() !== "INR") {
      throw this.buildError(
        "PhonePe only accepts INR-denominated payments",
        new Error(`Got currency ${currency_code}`)
      )
    }

    const merchantOrderId = this.buildMerchantOrderId(sessionId)
    const payAmount = getSmallestUnit(amount, currency_code)
    const merchantRedirectUrl = this.buildMerchantRedirectUrl(merchantOrderId)

    try {
      const order = await this.authedFetch<PhonePePayResponse>(
        "/checkout/v2/pay",
        {
          method: "POST",
          body: JSON.stringify({
            merchantOrderId,
            amount: payAmount,
            expireAfter: 1200,
            metaInfo: {
              udf1: sessionId ?? "",
              udf2: (context?.customer?.id as string | undefined) ?? "",
            },
            paymentFlow: {
              type: "PG_CHECKOUT",
              message: "Monsoon Coffee Co. order",
              merchantUrls: {
                redirectUrl: merchantRedirectUrl,
              },
            },
          }),
        }
      )

      return {
        id: merchantOrderId,
        data: {
          id: merchantOrderId,
          merchant_order_id: merchantOrderId,
          phonepe_order_id: order.orderId,
          redirect_url: order.redirectUrl,
          state: order.state,
          expire_at: order.expireAt,
          amount: payAmount,
          currency: currency_code.toUpperCase(),
        },
      }
    } catch (e) {
      throw this.buildError("Failed to create PhonePe payment", e)
    }
  }

  private buildMerchantRedirectUrl(merchantOrderId: string): string {
    const base = (
      this.options_.storefront_url ?? "http://localhost:8000"
    ).replace(/\/$/, "")
    // PhonePe will append ?state=COMPLETED|FAILED|...&code=... when it sends
    // the user back. The storefront route at /checkout/phonepe-return reads
    // merchantOrderId from the path and triggers the cart completion.
    return `${base}/checkout/phonepe-return/${encodeURIComponent(merchantOrderId)}`
  }

  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    const data = input.data ?? {}
    const merchantOrderId =
      (data.merchant_order_id as string | undefined) ??
      (data.id as string | undefined)

    if (!merchantOrderId) {
      throw this.buildError(
        "Missing PhonePe merchant order id",
        new Error("merchant_order_id not present in payment data")
      )
    }

    try {
      const status = await this.fetchOrderStatus(merchantOrderId)
      return {
        data: {
          ...data,
          status,
          last_state: status.state,
        },
        status: this.mapOrderStatus(status.state),
      }
    } catch (e) {
      throw this.buildError("Failed to authorize PhonePe payment", e)
    }
  }

  async capturePayment(
    input: CapturePaymentInput
  ): Promise<CapturePaymentOutput> {
    // PhonePe PG v2 charges immediately on a successful pay flow — there is
    // no separate capture step. We just return the latest status snapshot so
    // the payment record reflects PhonePe's view.
    const data = input.data ?? {}
    const merchantOrderId =
      (data.merchant_order_id as string | undefined) ??
      (data.id as string | undefined)
    if (!merchantOrderId) {
      return { data }
    }
    try {
      const status = await this.fetchOrderStatus(merchantOrderId)
      return {
        data: {
          ...data,
          status,
          last_state: status.state,
        },
      }
    } catch (e) {
      throw this.buildError("Failed to refresh PhonePe payment", e)
    }
  }

  async cancelPayment(
    input: CancelPaymentInput
  ): Promise<CancelPaymentOutput> {
    // PhonePe orders auto-expire after `expireAfter` seconds; we don't need
    // to call anything on their side for an unpaid order.
    return { data: input.data ?? {} }
  }

  async deletePayment(
    input: DeletePaymentInput
  ): Promise<DeletePaymentOutput> {
    return this.cancelPayment(input)
  }

  async refundPayment(
    input: RefundPaymentInput
  ): Promise<RefundPaymentOutput> {
    const data = input.data ?? {}
    const merchantOrderId =
      (data.merchant_order_id as string | undefined) ??
      (data.id as string | undefined)

    if (!merchantOrderId) {
      throw this.buildError(
        "Missing PhonePe merchant order id while refunding",
        new Error("merchant_order_id not present in payment data")
      )
    }

    const merchantRefundId = `${merchantOrderId}_refund_${Date.now()}`
    const currency = (data.currency as string | undefined) ?? "INR"

    try {
      const refund = await this.authedFetch<unknown>(
        "/payments/v2/refund",
        {
          method: "POST",
          body: JSON.stringify({
            merchantRefundId,
            originalMerchantOrderId: merchantOrderId,
            amount: getSmallestUnit(input.amount, currency),
          }),
        }
      )

      return {
        data: {
          ...data,
          refund,
          merchant_refund_id: merchantRefundId,
        },
      }
    } catch (e) {
      throw this.buildError("Failed to refund PhonePe payment", e)
    }
  }

  async retrievePayment(
    input: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> {
    const data = input.data ?? {}
    const merchantOrderId =
      (data.merchant_order_id as string | undefined) ??
      (data.id as string | undefined)

    if (!merchantOrderId) {
      return { data }
    }

    try {
      const status = await this.fetchOrderStatus(merchantOrderId)
      return { data: { ...data, status, last_state: status.state } }
    } catch (e) {
      throw this.buildError("Failed to retrieve PhonePe payment", e)
    }
  }

  async updatePayment(
    input: UpdatePaymentInput
  ): Promise<UpdatePaymentOutput> {
    // PhonePe SDK orders are not mutable — recreate when amount/currency change.
    const { amount, currency_code, data } = input
    const currentAmount = data?.amount
    const newAmount = getSmallestUnit(amount, currency_code)
    const currentCurrency = (data?.currency as string | undefined)?.toUpperCase()

    if (
      isDefined(currentAmount) &&
      Number(currentAmount) === newAmount &&
      currentCurrency === currency_code.toUpperCase()
    ) {
      return { data, status: PaymentSessionStatus.PENDING }
    }

    return this.initiatePayment(input)
  }

  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    const data = input.data ?? {}
    const merchantOrderId =
      (data.merchant_order_id as string | undefined) ??
      (data.id as string | undefined)

    if (!merchantOrderId) {
      return { status: PaymentSessionStatus.PENDING, data }
    }

    try {
      const status = await this.fetchOrderStatus(merchantOrderId)
      return {
        status: this.mapOrderStatus(status.state),
        data: { ...data, status, last_state: status.state },
      }
    } catch (e) {
      throw this.buildError("Failed to get PhonePe payment status", e)
    }
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    const { webhook_username, webhook_password } = this.options_
    if (!webhook_username || !webhook_password) {
      this.logger_.warn(
        "Received PhonePe webhook but `webhook_username`/`webhook_password` are not configured — skipping."
      )
      return { action: PaymentActions.NOT_SUPPORTED }
    }

    const signature = payload.headers["authorization"] as string | undefined
    if (!signature) {
      this.logger_.warn("PhonePe webhook missing Authorization header")
      return { action: PaymentActions.NOT_SUPPORTED }
    }

    const expected = crypto
      .createHash("sha256")
      .update(`${webhook_username}:${webhook_password}`)
      .digest("hex")

    if (expected !== signature) {
      this.logger_.warn("PhonePe webhook signature mismatch")
      return { action: PaymentActions.NOT_SUPPORTED }
    }

    const data = payload.data as
      | {
          event?: string
          payload?: {
            merchantOrderId?: string
            orderId?: string
            state?: PhonePeOrderState
            amount?: number
            metaInfo?: { udf1?: string }
          }
        }
      | undefined

    const entity = data?.payload
    if (!entity) {
      return { action: PaymentActions.NOT_SUPPORTED }
    }

    const sessionId = entity.metaInfo?.udf1 ?? ""
    const amount = entity.amount
      ? getAmountFromSmallestUnit(entity.amount, "INR")
      : 0

    switch (data?.event) {
      case "checkout.order.completed":
      case "pg.order.completed":
        return {
          action: PaymentActions.SUCCESSFUL,
          data: { session_id: sessionId, amount: new BigNumber(amount) },
        }
      case "checkout.order.failed":
      case "pg.order.failed":
        return {
          action: PaymentActions.FAILED,
          data: { session_id: sessionId, amount: new BigNumber(amount) },
        }
      case "pg.refund.completed":
        return {
          action: PaymentActions.SUCCESSFUL,
          data: { session_id: sessionId, amount: new BigNumber(amount) },
        }
      default:
        return { action: PaymentActions.NOT_SUPPORTED }
    }
  }

  private async fetchOrderStatus(
    merchantOrderId: string
  ): Promise<PhonePeOrderStatusResponse> {
    return this.authedFetch<PhonePeOrderStatusResponse>(
      `/checkout/v2/order/${encodeURIComponent(merchantOrderId)}/status?details=true`,
      { method: "GET" }
    )
  }

  private buildMerchantOrderId(sessionId?: string): string {
    const slug = (sessionId ?? "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 24)
    const ts = Date.now().toString(36)
    return slug ? `mc_${slug}_${ts}` : `mc_${ts}_${crypto.randomBytes(4).toString("hex")}`
  }

  private mapOrderStatus(state: PhonePeOrderState): PaymentSessionStatus {
    switch (state) {
      case "COMPLETED":
        return PaymentSessionStatus.CAPTURED
      case "FAILED":
        return PaymentSessionStatus.ERROR
      case "CANCELLED":
        return PaymentSessionStatus.CANCELED
      case "PENDING":
      default:
        return PaymentSessionStatus.PENDING
    }
  }

  private buildError(message: string, error: unknown): Error {
    const detail =
      (error as { message?: string })?.message ??
      (typeof error === "string" ? error : "Unknown error")
    return new Error(`${message}: ${detail}`)
  }
}

export default PhonePeProviderService

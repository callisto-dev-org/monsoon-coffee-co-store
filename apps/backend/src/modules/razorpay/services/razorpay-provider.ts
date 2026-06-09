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
  RazorpayOptions,
  RazorpayOrder,
  RazorpayPayment,
  RazorpayPaymentListResponse,
} from "../types"
import { getAmountFromSmallestUnit, getSmallestUnit } from "../utils"

type InjectedDependencies = {
  logger: Logger
}

const BASE_URL = "https://api.razorpay.com"

class RazorpayProviderService extends AbstractPaymentProvider<RazorpayOptions> {
  static identifier = PaymentProviderKeys.RAZORPAY

  protected readonly logger_: Logger
  protected readonly options_: RazorpayOptions
  protected readonly authHeader_: string

  static validateOptions(options: Record<string, unknown>): void | never {
    if (!isDefined(options.key_id) || !isDefined(options.key_secret)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Razorpay provider requires `key_id` and `key_secret` options."
      )
    }
  }

  constructor(container: InjectedDependencies, options: RazorpayOptions) {
    // @ts-expect-error - matching the upstream AbstractPaymentProvider pattern
    super(...arguments)
    this.logger_ = container.logger
    this.options_ = options
    this.authHeader_ = `Basic ${Buffer.from(
      `${options.key_id}:${options.key_secret}`
    ).toString("base64")}`
  }

  private get autoCapture(): boolean {
    // Default to capturing immediately so a successful checkout charges the
    // customer in one step, unless explicitly disabled.
    return this.options_.auto_capture !== false
  }

  private async apiFetch<T>(
    path: string,
    init: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: this.authHeader_,
      ...((init.headers as Record<string, string> | undefined) ?? {}),
    }
    const res = await fetch(`${BASE_URL}${path}`, { ...init, headers })
    const text = await res.text()
    let json: unknown = {}
    try {
      json = text ? JSON.parse(text) : {}
    } catch {
      json = { raw: text }
    }
    if (!res.ok) {
      const err = json as { error?: { description?: string; code?: string } }
      throw this.buildError(
        `Razorpay API error (${res.status})`,
        new Error(
          err.error?.description ??
            err.error?.code ??
            (text || `HTTP ${res.status}`)
        )
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

    // Razorpay's INR account only settles INR-denominated payments here.
    if (currency_code.toUpperCase() !== "INR") {
      throw this.buildError(
        "Razorpay only accepts INR-denominated payments",
        new Error(`Got currency ${currency_code}`)
      )
    }

    const orderAmount = getSmallestUnit(amount, currency_code)

    try {
      const order = await this.apiFetch<RazorpayOrder>("/v1/orders", {
        method: "POST",
        body: JSON.stringify({
          amount: orderAmount,
          currency: currency_code.toUpperCase(),
          receipt: this.buildReceipt(sessionId),
          notes: {
            session_id: sessionId ?? "",
            customer_id: (context?.customer?.id as string | undefined) ?? "",
          },
        }),
      })

      return {
        id: order.id,
        data: {
          id: order.id,
          razorpay_order_id: order.id,
          key_id: this.options_.key_id,
          amount: orderAmount,
          currency: currency_code.toUpperCase(),
          session_id: sessionId ?? "",
        },
      }
    } catch (e) {
      throw this.buildError("Failed to create Razorpay order", e)
    }
  }

  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    const data = input.data ?? {}
    const orderId =
      (data.razorpay_order_id as string | undefined) ??
      (data.id as string | undefined)

    if (!orderId) {
      throw this.buildError(
        "Missing Razorpay order id",
        new Error("razorpay_order_id not present in payment data")
      )
    }

    try {
      let payment = await this.findLatestPayment(orderId)

      if (
        payment &&
        payment.status === "authorized" &&
        this.autoCapture
      ) {
        payment = await this.captureRazorpayPayment(
          payment.id,
          payment.amount,
          payment.currency
        )
      }

      return {
        data: {
          ...data,
          razorpay_payment_id: payment?.id,
          last_status: payment?.status,
        },
        status: this.mapPaymentStatus(payment),
      }
    } catch (e) {
      throw this.buildError("Failed to authorize Razorpay payment", e)
    }
  }

  async capturePayment(
    input: CapturePaymentInput
  ): Promise<CapturePaymentOutput> {
    const data = input.data ?? {}
    const orderId =
      (data.razorpay_order_id as string | undefined) ??
      (data.id as string | undefined)

    try {
      let payment =
        (data.razorpay_payment_id as string | undefined)
          ? await this.fetchPayment(data.razorpay_payment_id as string)
          : orderId
          ? await this.findLatestPayment(orderId)
          : null

      // Idempotent: only capture an authorized (not yet captured) payment.
      if (payment && payment.status === "authorized") {
        payment = await this.captureRazorpayPayment(
          payment.id,
          payment.amount,
          payment.currency
        )
      }

      return {
        data: {
          ...data,
          razorpay_payment_id: payment?.id ?? data.razorpay_payment_id,
          last_status: payment?.status ?? data.last_status,
        },
      }
    } catch (e) {
      throw this.buildError("Failed to capture Razorpay payment", e)
    }
  }

  async cancelPayment(
    input: CancelPaymentInput
  ): Promise<CancelPaymentOutput> {
    // Unpaid Razorpay orders cannot be paid against once the cart is gone;
    // there's nothing to cancel on their side.
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
    let paymentId = data.razorpay_payment_id as string | undefined
    const orderId =
      (data.razorpay_order_id as string | undefined) ??
      (data.id as string | undefined)

    if (!paymentId && orderId) {
      paymentId = (await this.findLatestPayment(orderId))?.id
    }

    if (!paymentId) {
      throw this.buildError(
        "Missing Razorpay payment id while refunding",
        new Error("razorpay_payment_id not present in payment data")
      )
    }

    const currency = (data.currency as string | undefined) ?? "INR"

    try {
      const refund = await this.apiFetch<unknown>(
        `/v1/payments/${encodeURIComponent(paymentId)}/refund`,
        {
          method: "POST",
          body: JSON.stringify({
            amount: getSmallestUnit(input.amount, currency),
          }),
        }
      )

      return {
        data: {
          ...data,
          razorpay_payment_id: paymentId,
          refund,
        },
      }
    } catch (e) {
      throw this.buildError("Failed to refund Razorpay payment", e)
    }
  }

  async retrievePayment(
    input: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> {
    const data = input.data ?? {}
    const orderId =
      (data.razorpay_order_id as string | undefined) ??
      (data.id as string | undefined)

    if (!orderId) {
      return { data }
    }

    try {
      const payment = await this.findLatestPayment(orderId)
      return {
        data: {
          ...data,
          razorpay_payment_id: payment?.id ?? data.razorpay_payment_id,
          last_status: payment?.status ?? data.last_status,
        },
      }
    } catch (e) {
      throw this.buildError("Failed to retrieve Razorpay payment", e)
    }
  }

  async updatePayment(
    input: UpdatePaymentInput
  ): Promise<UpdatePaymentOutput> {
    // Razorpay orders are immutable — recreate when amount/currency change.
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
    const orderId =
      (data.razorpay_order_id as string | undefined) ??
      (data.id as string | undefined)

    if (!orderId) {
      return { status: PaymentSessionStatus.PENDING, data }
    }

    try {
      const payment = await this.findLatestPayment(orderId)
      return {
        status: this.mapPaymentStatus(payment),
        data: {
          ...data,
          razorpay_payment_id: payment?.id ?? data.razorpay_payment_id,
          last_status: payment?.status ?? data.last_status,
        },
      }
    } catch (e) {
      throw this.buildError("Failed to get Razorpay payment status", e)
    }
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    const { webhook_secret } = this.options_
    if (!webhook_secret) {
      this.logger_.warn(
        "Received Razorpay webhook but `webhook_secret` is not configured — skipping."
      )
      return { action: PaymentActions.NOT_SUPPORTED }
    }

    const signature = payload.headers["x-razorpay-signature"] as
      | string
      | undefined
    if (!signature) {
      this.logger_.warn("Razorpay webhook missing X-Razorpay-Signature header")
      return { action: PaymentActions.NOT_SUPPORTED }
    }

    const rawBody = payload.rawData as Buffer | string | undefined
    if (!rawBody) {
      this.logger_.warn("Razorpay webhook missing raw body for verification")
      return { action: PaymentActions.NOT_SUPPORTED }
    }

    const expected = crypto
      .createHmac("sha256", webhook_secret)
      .update(typeof rawBody === "string" ? rawBody : Buffer.from(rawBody))
      .digest("hex")

    const valid =
      expected.length === signature.length &&
      crypto.timingSafeEqual(
        Buffer.from(expected),
        Buffer.from(signature)
      )
    if (!valid) {
      this.logger_.warn("Razorpay webhook signature mismatch")
      return { action: PaymentActions.NOT_SUPPORTED }
    }

    const body = payload.data as
      | {
          event?: string
          payload?: {
            payment?: { entity?: RazorpayPayment }
            refund?: { entity?: { payment_id?: string; amount?: number } }
          }
        }
      | undefined

    const event = body?.event
    const paymentEntity = body?.payload?.payment?.entity

    const resolveSession = async (
      entity?: RazorpayPayment
    ): Promise<{ sessionId: string; amount: number }> => {
      const orderId = entity?.order_id
      let sessionId = entity?.notes?.session_id ?? ""
      if (!sessionId && orderId) {
        const order = await this.fetchOrder(orderId).catch(() => null)
        sessionId = order?.notes?.session_id ?? ""
      }
      const amount = entity?.amount
        ? getAmountFromSmallestUnit(entity.amount, entity.currency ?? "INR")
        : 0
      return { sessionId, amount }
    }

    switch (event) {
      case "payment.captured":
      case "order.paid": {
        const { sessionId, amount } = await resolveSession(paymentEntity)
        return {
          action: PaymentActions.SUCCESSFUL,
          data: { session_id: sessionId, amount: new BigNumber(amount) },
        }
      }
      case "payment.authorized": {
        if (this.autoCapture) {
          // We capture during authorize; treat as still in-flight here.
          return { action: PaymentActions.NOT_SUPPORTED }
        }
        const { sessionId, amount } = await resolveSession(paymentEntity)
        return {
          action: PaymentActions.AUTHORIZED,
          data: { session_id: sessionId, amount: new BigNumber(amount) },
        }
      }
      case "payment.failed": {
        const { sessionId, amount } = await resolveSession(paymentEntity)
        return {
          action: PaymentActions.FAILED,
          data: { session_id: sessionId, amount: new BigNumber(amount) },
        }
      }
      default:
        return { action: PaymentActions.NOT_SUPPORTED }
    }
  }

  private async findLatestPayment(
    orderId: string
  ): Promise<RazorpayPayment | null> {
    const res = await this.apiFetch<RazorpayPaymentListResponse>(
      `/v1/orders/${encodeURIComponent(orderId)}/payments`,
      { method: "GET" }
    )
    const items = res.items ?? []
    if (!items.length) {
      return null
    }
    // Prefer a captured payment, then authorized, otherwise the last entry.
    return (
      items.find((p) => p.status === "captured") ??
      items.find((p) => p.status === "authorized") ??
      items[items.length - 1]
    )
  }

  private async fetchPayment(paymentId: string): Promise<RazorpayPayment> {
    return this.apiFetch<RazorpayPayment>(
      `/v1/payments/${encodeURIComponent(paymentId)}`,
      { method: "GET" }
    )
  }

  private async fetchOrder(orderId: string): Promise<RazorpayOrder> {
    return this.apiFetch<RazorpayOrder>(
      `/v1/orders/${encodeURIComponent(orderId)}`,
      { method: "GET" }
    )
  }

  private async captureRazorpayPayment(
    paymentId: string,
    amount: number,
    currency: string
  ): Promise<RazorpayPayment> {
    return this.apiFetch<RazorpayPayment>(
      `/v1/payments/${encodeURIComponent(paymentId)}/capture`,
      {
        method: "POST",
        body: JSON.stringify({ amount, currency: currency.toUpperCase() }),
      }
    )
  }

  private buildReceipt(sessionId?: string): string {
    const slug = (sessionId ?? "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 32)
    const ts = Date.now().toString(36)
    // Razorpay caps receipt length at 40 chars.
    return (slug ? `mc_${slug}` : `mc_${ts}`).slice(0, 40)
  }

  private mapPaymentStatus(
    payment: RazorpayPayment | null
  ): PaymentSessionStatus {
    switch (payment?.status) {
      case "captured":
        return PaymentSessionStatus.CAPTURED
      case "authorized":
        return PaymentSessionStatus.AUTHORIZED
      case "refunded":
        return PaymentSessionStatus.CAPTURED
      case "failed":
        return PaymentSessionStatus.ERROR
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

export default RazorpayProviderService

export type PhonePeOptions = {
  /**
   * PhonePe PG v2 client ID issued by the merchant dashboard.
   */
  client_id: string
  /**
   * PhonePe PG v2 client secret.
   */
  client_secret: string
  /**
   * PhonePe PG v2 client version (numeric, e.g. 1).
   */
  client_version: number | string
  /**
   * Environment to hit. "sandbox" (default) points at api-preprod.phonepe.com;
   * "production" points at api.phonepe.com.
   */
  environment?: "sandbox" | "production"
  /**
   * Storefront base URL (e.g. http://localhost:8000). Used to build the
   * `redirectUrl` PhonePe sends the user back to after the iframe closes.
   */
  storefront_url?: string
  /**
   * Optional override for the webhook username configured in the PhonePe
   * dashboard. Required for webhook signature verification.
   */
  webhook_username?: string
  /**
   * Optional override for the webhook password configured in the PhonePe
   * dashboard. Required for webhook signature verification.
   */
  webhook_password?: string
}

export const PaymentProviderKeys = {
  PHONEPE: "phonepe",
} as const

export type PhonePeOrderState =
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"

export type PhonePePayResponse = {
  orderId: string
  state: PhonePeOrderState
  expireAt: number
  redirectUrl: string
}

export type PhonePeOrderStatusResponse = {
  orderId: string
  state: PhonePeOrderState
  amount: number
  payableAmount?: number
  feeAmount?: number
  expireAt?: number
  metaInfo?: Record<string, unknown>
  paymentDetails?: Array<{
    transactionId?: string
    paymentMode?: string
    state?: PhonePeOrderState
    amount?: number
    timestamp?: number
  }>
}

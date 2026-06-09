export type RazorpayOptions = {
  /**
   * Razorpay API key id (`rzp_test_...` / `rzp_live_...`) issued by the
   * Razorpay dashboard.
   */
  key_id: string
  /**
   * Razorpay API key secret paired with `key_id`. Used for Basic-auth API
   * calls; never exposed to the storefront.
   */
  key_secret: string
  /**
   * Whether to capture authorized payments automatically during the
   * authorize step. Defaults to `true` so a successful checkout charges the
   * customer immediately (mirrors the auto-capture setting in the dashboard).
   */
  auto_capture?: boolean
  /**
   * Webhook secret configured in the Razorpay dashboard. Required for webhook
   * signature verification at {BACKEND_URL}/hooks/payment/pp_razorpay_razorpay.
   */
  webhook_secret?: string
}

export const PaymentProviderKeys = {
  RAZORPAY: "razorpay",
} as const

export type RazorpayOrderStatus = "created" | "attempted" | "paid"

export type RazorpayPaymentStatus =
  | "created"
  | "authorized"
  | "captured"
  | "refunded"
  | "failed"

export type RazorpayOrder = {
  id: string
  amount: number
  amount_paid?: number
  amount_due?: number
  currency: string
  receipt?: string
  status: RazorpayOrderStatus
  notes?: Record<string, string>
}

export type RazorpayPayment = {
  id: string
  order_id: string
  status: RazorpayPaymentStatus
  amount: number
  currency: string
  method?: string
  captured?: boolean
  notes?: Record<string, string>
  error_description?: string
}

export type RazorpayPaymentListResponse = {
  count: number
  items: RazorpayPayment[]
}

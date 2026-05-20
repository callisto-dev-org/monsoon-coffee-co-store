"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { cancelOrder, requestOrderRefund } from "@lib/data/orders"
import { OutlineButton } from "@modules/common/components/monsoon/buttons"

type Props = {
  order: HttpTypes.StoreOrder
}

type ActionKind = "cancel" | "refund"

const labels: Record<ActionKind, { title: string; cta: string; body: string }> =
  {
    cancel: {
      title: "Cancel order",
      cta: "Yes, cancel order",
      body: "This will cancel the order and release any pending payments. This cannot be undone.",
    },
    refund: {
      title: "Refund order",
      cta: "Yes, refund order",
      body: "This requests a refund for the captured payment on this delivered order.",
    },
  }

const OrderActions = ({ order }: Props) => {
  const router = useRouter()
  const [action, setAction] = useState<ActionKind | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const canCancel =
    !order.canceled_at &&
    order.status === "pending" &&
    (!order.fulfillment_status ||
      order.fulfillment_status === "not_fulfilled")

  const canRefund =
    !order.canceled_at && order.fulfillment_status === "delivered"

  if (!canCancel && !canRefund) {
    return null
  }

  const close = () => {
    if (pending) return
    setAction(null)
    setError(null)
  }

  const onConfirm = () => {
    if (!action) return
    setError(null)
    startTransition(async () => {
      const result =
        action === "cancel"
          ? await cancelOrder(order.id)
          : await requestOrderRefund(order.id)

      if (!result.success) {
        
        setError(result.error ?? "Something went wrong.")
        return
      }

      setAction(null)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-3 border-t border-ink/20 pt-6 sm:flex-row sm:flex-wrap">
      {canCancel && (
        <OutlineButton
          type="button"
          onClick={() => setAction("cancel")}
          className="border-red-700 px-5 py-3 font-family-heading text-sm font-bold uppercase tracking-[0.08em] text-red-700 hover:bg-red-700 hover:text-surface"
          data-testid="cancel-order-button"
        >
          Cancel Order
        </OutlineButton>
      )}
      {canRefund && (
        <OutlineButton
          type="button"
          onClick={() => setAction("refund")}
          className="border-ink px-5 py-3 font-family-heading text-sm font-bold uppercase tracking-[0.08em] text-ink hover:bg-ink hover:text-surface"
          data-testid="refund-order-button"
        >
          Request Refund
        </OutlineButton>
      )}

      {action && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4"
          onClick={close}
        >
          <div
            className="w-full max-w-lg border-2 border-ink bg-surface p-8 shadow-[6px_6px_0px_0px_var(--mc-ink)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-family-heading text-2xl font-black uppercase text-ink">
              {labels[action].title}
            </h2>
            <p className="mt-4 font-family-base text-base text-ink/75">
              {labels[action].body}
            </p>
            {error && (
              <p
                role="alert"
                className="mt-4 border-2 border-red-700 bg-red-50 px-3 py-2 font-family-base text-sm text-red-700"
              >
                {error}
              </p>
            )}
            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <OutlineButton
                type="button"
                onClick={close}
                disabled={pending}
                className="px-5 py-3 font-family-heading text-sm font-bold uppercase tracking-[0.08em] text-ink hover:bg-ink hover:text-surface disabled:opacity-50"
              >
                Back
              </OutlineButton>
              <OutlineButton
                type="button"
                onClick={onConfirm}
                disabled={pending}
                className={`px-5 py-3 font-family-heading text-sm font-bold uppercase tracking-[0.08em] disabled:opacity-50 ${
                  action === "cancel"
                    ? "border-red-700 bg-red-700 text-surface hover:bg-red-800"
                    : "border-ink bg-ink text-surface hover:bg-ink/80"
                }`}
                data-testid={`confirm-${action}-button`}
              >
                {pending ? "Submitting…" : labels[action].cta}
              </OutlineButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderActions

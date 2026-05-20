"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Modal, btnGhostCls } from "@/components/modal"
import {
  deleteReview,
  fetchProductReviews,
  type AdminReview,
  type AdminReviewSummary,
} from "./actions"

export function ViewReviewsModal({
  open,
  onClose,
  productId,
  productTitle,
}: {
  open: boolean
  onClose: () => void
  productId: string
  productTitle: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [summary, setSummary] = useState<AdminReviewSummary>({
    count: 0,
    average_rating: 0,
  })
  const [pending, startAct] = useTransition()
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchProductReviews(productId).then((res) => {
      if (cancelled) return
      if (res.ok) {
        setReviews(res.data?.reviews || [])
        setSummary(
          res.data?.summary || { count: 0, average_rating: 0 }
        )
      } else {
        setError(res.error)
      }
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [open, productId])

  function remove(r: AdminReview) {
    if (
      !confirm(
        `Delete this review by "${r.customer_name || "Anonymous"}"? This cannot be undone.`
      )
    )
      return
    setError(null)
    startAct(async () => {
      const res = await deleteReview(r.id)
      if (res.ok) {
        setReviews((cur) => cur.filter((x) => x.id !== r.id))
        setSummary((cur) => {
          const count = Math.max(0, cur.count - 1)
          const total =
            cur.average_rating * cur.count - (r.rating || 0)
          const avg = count > 0 ? total / count : 0
          return { count, average_rating: Number(avg.toFixed(2)) }
        })
        router.refresh()
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <Modal
      open={open}
      onClose={() => !pending && onClose()}
      title="Reviews"
      subtitle={`${productTitle} · ${summary.count} review${summary.count === 1 ? "" : "s"} · avg ${summary.average_rating.toFixed(2)}`}
      size="lg"
    >
      {loading ? (
        <p className="border border-mc-ink/20 bg-mc-ink/5 p-4 text-sm text-mc-secondary">
          Loading reviews…
        </p>
      ) : error ? (
        <p className="border-l-2 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : reviews.length === 0 ? (
        <p className="border border-mc-ink/20 bg-mc-ink/5 p-4 text-sm text-mc-secondary">
          No reviews for this product yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <ReviewRow
              key={r.id}
              review={r}
              pending={pending}
              onDelete={() => remove(r)}
              onOpenImage={setPreviewImage}
            />
          ))}
        </ul>
      )}

      <div className="mt-5 flex justify-end border-t border-mc-ink/15 pt-4">
        <button
          type="button"
          className={btnGhostCls}
          onClick={onClose}
          disabled={pending}
        >
          Close
        </button>
      </div>

      {/* Lightbox for clicking a review photo */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center bg-mc-ink/85 p-6"
          onClick={() => setPreviewImage(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewImage}
            alt=""
            className="max-h-[85vh] max-w-[90vw] border-2 border-mc-surface object-contain"
          />
        </div>
      )}
    </Modal>
  )
}

/* ─────────────── Row ─────────────── */

function ReviewRow({
  review,
  pending,
  onDelete,
  onOpenImage,
}: {
  review: AdminReview
  pending: boolean
  onDelete: () => void
  onOpenImage: (url: string) => void
}) {
  const date = review.created_at
    ? new Date(review.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : ""

  const name =
    review.customer_name?.trim() ||
    (review.customer_id ? "Verified buyer" : "Anonymous")

  const images = (review.images ?? []).filter(Boolean)

  return (
    <li className="border-2 border-mc-ink/20">
      <header className="flex flex-wrap items-start gap-3 border-b border-mc-ink/15 bg-mc-ink/5 px-4 py-2.5">
        <div className="flex-1 min-w-0">
          <p className="font-display text-sm font-bold uppercase tracking-wide">
            {name}{" "}
            <span
              className="ml-2 font-display text-[11px] font-bold uppercase tracking-[0.18em]"
              style={{ color: "rgb(var(--mc-primary-rgb))" }}
            >
              {review.rating}/5 ★
            </span>
          </p>
          <p className="text-[10px] text-mc-secondary">
            {date}
            {review.variant_title && (
              <>
                {date && " · "}
                <span className="font-mono">{review.variant_title}</span>
              </>
            )}
            {review.customer_id && (
              <>
                {(date || review.variant_title) && " · "}
                <span>Verified buyer</span>
              </>
            )}
            {review.status !== "published" && (
              <>
                {" · "}
                <span className="font-bold uppercase tracking-widest text-amber-700">
                  {review.status}
                </span>
              </>
            )}
          </p>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={onDelete}
          className="border border-mc-ink/30 px-2 py-1 font-display text-[10px] font-bold uppercase tracking-[0.16em] text-red-700 hover:border-red-700 disabled:opacity-50"
        >
          Delete
        </button>
      </header>

      <div className="p-4">
        {review.title && (
          <h4 className="mb-2 font-display text-base font-black uppercase tracking-tight">
            {review.title}
          </h4>
        )}
        <p className="whitespace-pre-line text-sm leading-relaxed text-mc-ink/85">
          {review.body}
        </p>
        {images.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {images.map((url, i) => (
              <button
                key={`${url}-${i}`}
                type="button"
                onClick={() => onOpenImage(url)}
                aria-label={`Open photo ${i + 1}`}
                className="relative h-20 w-20 overflow-hidden border-2 border-mc-ink/20 transition hover:border-mc-ink"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </li>
  )
}

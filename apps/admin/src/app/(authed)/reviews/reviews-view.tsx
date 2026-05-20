"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import {
  deleteReview,
  listAllReviews,
  type AdminReview,
  type ReviewsListResult,
} from "./actions"
import type { ProductLite } from "./page"

const PAGE_SIZE = 20

type Status = "" | "pending" | "published" | "rejected"
type Rating = "" | "1" | "2" | "3" | "4" | "5"

export function ReviewsView({
  initial,
  products,
}: {
  initial: ReviewsListResult
  products: ProductLite[]
}) {
  const [reviews, setReviews] = useState<AdminReview[]>(initial.reviews)
  const [total, setTotal] = useState(initial.total)
  const [summary, setSummary] = useState(initial.summary)

  const [productId, setProductId] = useState("")
  const [status, setStatus] = useState<Status>("")
  const [rating, setRating] = useState<Rating>("")
  const [q, setQ] = useState("")
  const [debouncedQ, setDebouncedQ] = useState("")
  const [page, setPage] = useState(0)

  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  // Debounce the search box so we don't fire on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 250)
    return () => clearTimeout(t)
  }, [q])

  // Re-fetch on any filter change. Always resets to page 0 on filter change.
  useEffect(() => {
    setError(null)
    start(async () => {
      const res = await listAllReviews({
        product_id: productId || undefined,
        status: status || undefined,
        rating: rating ? Number(rating) : undefined,
        q: debouncedQ || undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      })
      if (res.ok && res.data) {
        setReviews(res.data.reviews)
        setTotal(res.data.total)
        setSummary(res.data.summary)
      } else if (!res.ok) {
        setError(res.error)
      }
    })
  }, [productId, status, rating, debouncedQ, page])

  useEffect(() => {
    // Filter changes should bounce us back to the first page.
    setPage(0)
  }, [productId, status, rating, debouncedQ])

  const productById = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  )

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function clearFilters() {
    setProductId("")
    setStatus("")
    setRating("")
    setQ("")
  }

  function remove(r: AdminReview) {
    if (
      !confirm(
        `Delete this review by "${r.customer_name || "Anonymous"}"? This cannot be undone.`
      )
    )
      return
    start(async () => {
      const res = await deleteReview(r.id)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setReviews((cur) => cur.filter((x) => x.id !== r.id))
      setTotal((t) => Math.max(0, t - 1))
    })
  }

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.24em] text-mc-primary">
            Moderation
          </p>
          <h1 className="mt-1 font-display text-3xl font-black uppercase">
            Reviews
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-mc-secondary">
            Every customer review across the catalogue. Filter, search, and
            remove notes that violate the guidelines.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <SummaryStat label="Visible" value={summary.count} />
          <SummaryStat
            label="Avg rating"
            value={summary.average_rating || 0}
            format="decimal"
          />
          {Object.entries(summary.by_status).map(([k, v]) => (
            <SummaryStat key={k} label={k} value={v} />
          ))}
        </div>
      </header>

      {/* Filters */}
      <section className="mb-6 border-2 border-mc-ink bg-mc-surface p-4 shadow-[4px_4px_0px_0px_rgb(var(--mc-ink-rgb))]">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Field label="Product">
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className={fieldCls}
            >
              <option value="">All products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
              className={fieldCls}
            >
              <option value="">Any status</option>
              <option value="published">Published</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </Field>
          <Field label="Rating">
            <select
              value={rating}
              onChange={(e) => setRating(e.target.value as Rating)}
              className={fieldCls}
            >
              <option value="">Any rating</option>
              <option value="5">5 stars only</option>
              <option value="4">4 stars only</option>
              <option value="3">3 stars only</option>
              <option value="2">2 stars only</option>
              <option value="1">1 star only</option>
            </select>
          </Field>
          <Field label="Search">
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Title, body, name…"
              className={fieldCls}
            />
          </Field>
        </div>
        <div className="mt-3 flex items-center justify-between gap-4">
          <p className="text-xs text-mc-secondary">
            {pending ? "Loading…" : `${total} total`}
          </p>
          {(productId || status || rating || q) && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-[11px] font-bold uppercase tracking-[0.18em] text-mc-secondary hover:text-mc-ink"
            >
              Clear filters
            </button>
          )}
        </div>
      </section>

      {error && (
        <p className="mb-4 border-l-2 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* List */}
      {reviews.length === 0 ? (
        <div className="border-2 border-dashed border-mc-ink/30 bg-mc-surface/50 p-12 text-center text-sm text-mc-secondary">
          {pending
            ? "Loading reviews…"
            : "No reviews match the current filters."}
        </div>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <ReviewCard
              key={r.id}
              review={r}
              product={productById.get(r.product_id)}
              pending={pending}
              onDelete={() => remove(r)}
              onOpenImage={setPreview}
            />
          ))}
        </ul>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          aria-label="Reviews pagination"
          className="mt-6 flex items-center justify-between gap-4"
        >
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0 || pending}
            className="inline-flex items-center gap-2 border-2 border-mc-ink/30 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-mc-ink hover:border-mc-ink disabled:opacity-30"
          >
            ← Prev
          </button>
          <p className="text-xs text-mc-secondary">
            Page {page + 1} of {totalPages}
          </p>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1 || pending}
            className="inline-flex items-center gap-2 border-2 border-mc-ink/30 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-mc-ink hover:border-mc-ink disabled:opacity-30"
          >
            Next →
          </button>
        </nav>
      )}

      {preview && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-mc-ink/85 p-6"
          onClick={() => setPreview(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt=""
            className="max-h-[85vh] max-w-[90vw] border-2 border-mc-surface object-contain"
          />
        </div>
      )}
    </div>
  )
}

/* ─────────────── Card ─────────────── */

function ReviewCard({
  review,
  product,
  pending,
  onDelete,
  onOpenImage,
}: {
  review: AdminReview
  product?: ProductLite
  pending: boolean
  onDelete: () => void
  onOpenImage: (url: string) => void
}) {
  const date = review.created_at
    ? new Date(review.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : ""

  const name =
    review.customer_name?.trim() ||
    (review.customer_id ? "Verified buyer" : "Anonymous")

  const images = (review.images ?? []).filter(Boolean)

  return (
    <li className="border-2 border-mc-ink bg-mc-surface shadow-[4px_4px_0px_0px_rgb(var(--mc-ink-rgb))]">
      <header className="flex flex-wrap items-start gap-3 border-b border-mc-ink/15 px-4 py-3">
        {product?.thumbnail ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={product.thumbnail}
            alt=""
            className="h-12 w-12 shrink-0 border border-mc-ink/30 object-cover"
          />
        ) : (
          <div className="grid h-12 w-12 shrink-0 place-items-center border border-mc-ink/30 text-[10px] font-bold uppercase text-mc-secondary">
            n/a
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="truncate font-display text-sm font-bold uppercase tracking-wide text-mc-ink">
            {product?.title || review.product_id}
          </p>
          <p className="text-[10px] text-mc-secondary">
            {name}
            {date && ` · ${date}`}
            {review.variant_title && (
              <>
                {" · "}
                <span className="font-mono">{review.variant_title}</span>
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
        <span
          className="font-display text-xs font-bold uppercase tracking-[0.18em]"
          style={{ color: "rgb(var(--mc-primary-rgb))" }}
        >
          {review.rating}/5 ★
        </span>
        <button
          type="button"
          disabled={pending}
          onClick={onDelete}
          className="border border-mc-ink/30 px-2 py-1 font-display text-[10px] font-bold uppercase tracking-[0.16em] text-red-700 hover:border-red-700 disabled:opacity-50"
        >
          Delete
        </button>
      </header>

      <div className="px-4 py-3">
        {review.title && (
          <h3 className="mb-2 font-display text-base font-black uppercase tracking-tight">
            {review.title}
          </h3>
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
                className="relative h-16 w-16 overflow-hidden border-2 border-mc-ink/20 transition hover:border-mc-ink"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </li>
  )
}

/* ─────────────── Atoms ─────────────── */

const fieldCls =
  "w-full border-2 border-mc-ink/30 bg-transparent px-3 py-2 text-sm outline-none focus:border-mc-primary"

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-mc-secondary">
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  )
}

function SummaryStat({
  label,
  value,
  format = "int",
}: {
  label: string
  value: number
  format?: "int" | "decimal"
}) {
  return (
    <div className="border-2 border-mc-ink bg-mc-surface px-4 py-2 shadow-[3px_3px_0px_0px_rgb(var(--mc-ink-rgb))]">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-mc-secondary">
        {label}
      </p>
      <p className="mt-0.5 font-display text-xl font-black tabular-nums">
        {format === "decimal" ? value.toFixed(2) : value.toFixed(0)}
      </p>
    </div>
  )
}

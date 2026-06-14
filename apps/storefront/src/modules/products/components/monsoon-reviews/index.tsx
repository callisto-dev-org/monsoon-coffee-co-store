"use client"

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { Review, ReviewImageInput, ReviewSummary } from "@lib/data/reviews"
import { createProductReview } from "@lib/data/reviews"

export type ProductVariantOption = {
  id: string
  title: string
}

type Props = {
  productId: string
  productHandle: string
  productTitle: string
  productSubtitle?: string | null
  productImages?: string[]
  productVariants?: ProductVariantOption[]
  countryCode: string
  isAuthenticated: boolean
  initialReviews: Review[]
  initialSummary: ReviewSummary
}

const PLACEHOLDER = "/monsoon/images/Product.png"
const MAX_IMAGES = 5
// Hard cap on the original file the user picks. Anything over this is rejected
// outright — even after compression a 25MB raw file isn't worth processing.
const MAX_RAW_BYTES = 12 * 1024 * 1024
// Longest edge the compressor will target. Most phones output 4000px+; 1600
// is plenty for product reviews and keeps the base64 payload well under the
// server's body limit.
const COMPRESS_MAX_EDGE = 1600
const COMPRESS_QUALITY = 0.82

export default function MonsoonReviews({
  productId,
  productHandle,
  productTitle,
  productSubtitle,
  productImages = [],
  productVariants = [],
  countryCode,
  isAuthenticated,
  initialReviews,
  initialSummary,
}: Props) {
  const router = useRouter()
  const [reviews, setReviews] = useState(initialReviews)
  const [summary, setSummary] = useState(initialSummary)
  const [formOpen, setFormOpen] = useState(false)
  const [detailReview, setDetailReview] = useState<Review | null>(null)
  const [detailFallback, setDetailFallback] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const REVIEWS_PER_PAGE = 2

  const description = useMemo(() => {
    if (productSubtitle?.trim()) return productSubtitle.trim()
    if (summary.count > 0 && summary.average_rating >= 4.5) {
      return `${productTitle} is one of our highest-rated, loved for its consistency.`
    }
    if (summary.count > 0) {
      return `What other customers are saying about ${productTitle}.`
    }
    return `No reviews yet for ${productTitle}. Yours could be the first.`
  }, [productSubtitle, productTitle, summary])

  const imagePool = productImages.length ? productImages : [PLACEHOLDER]

  return (
    <section className="w-full border-y-4 py-16 sm:py-28 lg:py-40 border-ink font-family-base">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-3 lg:gap-16 lg:px-12 lg:py-20">
        {/* ───────── Left column: ledger ───────── */}
        <aside className="flex flex-col gap-6">
          <h2 className="text-4xl font-black leading-[0.95] tracking-tight uppercase text-ink lg:text-5xl">
            Customer
            <br />
            Stash
          </h2>

          <div className="flex items-start gap-3">
            <span className="text-5xl font-black tracking-tight text-ink">
              {summary.count > 0 ? summary.average_rating.toFixed(1) : "—"}
            </span>
            <div className="pt-2">
              <Stars value={summary.average_rating} size={22} />
              <p className="mt-2 text-sm font-bold uppercase tracking-[0.18em] text-ink/55">
                {summary.count > 0
                  ? `Based on ${summary.count} review${summary.count === 1 ? "" : "s"}`
                  : "No reviews yet"}
              </p>
            </div>
          </div>

          <p className="text-base leading-relaxed text-ink/65">{description}</p>

          {!isAuthenticated ? (
            <Link
              href={`/${countryCode}/auth/login?returnTo=${encodeURIComponent(
                `/${countryCode}/products/${productHandle}#reviews`
              )}`}
              className="mt-2 inline-flex w-full items-center justify-center bg-ink px-6 py-4 text-xs font-bold uppercase tracking-[0.24em] text-surface transition hover:bg-accent"
            >
              Sign in to review
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="mt-2 inline-flex w-full items-center justify-center bg-ink px-6 py-4 text-xs font-bold uppercase tracking-[0.24em] text-surface transition hover:bg-accent"
            >
              Write a review
            </button>
          )}
        </aside>

        {/* ───────── Right column: reviews ───────── */}
        <div className="flex flex-col gap-14 lg:col-span-2">
          {reviews.length === 0 ? (
            <div className="border-2 border-dashed border-ink/15 bg-surface px-8 py-16 text-center">
              <p className="text-2xl font-black uppercase tracking-tight text-ink">
                No reviews yet
              </p>
              <p className="mt-3 text-sm text-ink/55">
                Be the first to write about {productTitle}.
              </p>
            </div>
          ) : (
            (() => {
              const totalPages = Math.max(
                1,
                Math.ceil(reviews.length / REVIEWS_PER_PAGE)
              )
              const safePage = Math.min(page, totalPages - 1)
              const start = safePage * REVIEWS_PER_PAGE
              const visible = reviews.slice(start, start + REVIEWS_PER_PAGE)
              return (
                <>
                  {visible.map((r, i) => {
                    // Position in the absolute list controls image-side alternation
                    // so it stays stable across pages.
                    const absolute = start + i
                    const fallback = imagePool[absolute % imagePool.length]
                    return (
                      <ReviewRow
                        key={r.id}
                        review={r}
                        fallbackImage={fallback}
                        imageOnRight={absolute % 2 === 1}
                        onOpen={() => {
                          setDetailReview(r)
                          setDetailFallback(fallback)
                        }}
                      />
                    )
                  })}

                  {totalPages > 1 && (
                    <nav
                      className="flex items-center justify-between gap-4 border-t-2 border-ink/10 pt-6"
                      aria-label="Reviews pagination"
                    >
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={safePage === 0}
                        className="inline-flex items-center gap-2 border-2 border-ink/30 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.24em] text-ink transition hover:border-ink disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        ← Prev
                      </button>

                      <div className="flex items-center gap-2">
                        {Array.from({ length: totalPages }).map((_, i) => {
                          const active = i === safePage
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setPage(i)}
                              aria-label={`Go to page ${i + 1}`}
                              aria-current={active ? "page" : undefined}
                              className={
                                active
                                  ? "h-9 w-9 border-2 border-ink bg-ink text-[12px] font-bold text-surface"
                                  : "h-9 w-9 border-2 border-ink/30 text-[12px] font-bold text-ink hover:border-ink"
                              }
                            >
                              {i + 1}
                            </button>
                          )
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setPage((p) => Math.min(totalPages - 1, p + 1))
                        }
                        disabled={safePage >= totalPages - 1}
                        className="inline-flex items-center gap-2 border-2 border-ink/30 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.24em] text-ink transition hover:border-ink disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        Next →
                      </button>
                    </nav>
                  )}
                </>
              )
            })()
          )}
        </div>
      </div>

      {/* ───────── Modal: write a review ───────── */}
      <ReviewShell
        open={formOpen && isAuthenticated}
        onClose={() => setFormOpen(false)}
        kicker="Leave a note"
        title={`Review ${productTitle}`}
        ariaLabel="Write a review"
      >
        <ReviewForm
          productId={productId}
          productHandle={productHandle}
          countryCode={countryCode}
          variants={productVariants}
          onCancel={() => setFormOpen(false)}
          onCreated={(review) => {
            setFormOpen(false)
            setReviews((cur) => [review, ...cur])
            setSummary((cur) => {
              const count = cur.count + 1
              const avg =
                (cur.average_rating * cur.count + review.rating) / count
              return { count, average_rating: Number(avg.toFixed(2)) }
            })
            router.refresh()
          }}
        />
      </ReviewShell>

      {/* ───────── Modal: read a review ───────── */}
      <ReviewShell
        open={!!detailReview}
        onClose={() => setDetailReview(null)}
        kicker="Tasting note"
        title={detailReview?.title || "Untitled note"}
        ariaLabel="Review details"
        size="wide"
      >
        {detailReview && (
          <ReviewDetail
            review={detailReview}
            fallbackImage={detailFallback || imagePool[0]}
          />
        )}
      </ReviewShell>
    </section>
  )
}

/* ───────────────── Review row (clickable) ───────────────── */

function ReviewRow({
  review,
  fallbackImage,
  imageOnRight,
  onOpen,
}: {
  review: Review
  fallbackImage: string
  imageOnRight: boolean
  onOpen: () => void
}) {
  const date = review.created_at
    ? new Date(review.created_at)
        .toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
        .toUpperCase()
    : ""

  const name = formatName(review.customer_name)
  const reviewImages = (review.images ?? []).filter(Boolean)
  const primaryImage = reviewImages[0] ?? fallbackImage
  const extraCount = Math.max(0, reviewImages.length - 1)

  const ImageBlock = (
    <div className="relative aspect-square w-24 shrink-0 overflow-hidden bg-ink/5 sm:w-36 lg:w-44">
      <Image
        src={primaryImage}
        alt=""
        fill
        sizes="(min-width:1024px) 176px, (min-width:640px) 160px, 128px"
        className="object-cover transition group-hover:scale-[1.03]"
      />
      {extraCount > 0 && (
        <span className="absolute bottom-2 right-2 grid h-6 min-w-[28px] place-items-center bg-ink/85 px-1.5 font-family-base text-[10px] font-bold uppercase tracking-[0.18em] text-surface">
          +{extraCount}
        </span>
      )}
    </div>
  )

  const Body = (
    <div className="flex-1 min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <h3 className="min-w-0 break-words text-base font-black uppercase tracking-tight text-ink lg:text-lg">
          {review.title || "Untitled note"}
        </h3>
        {date && (
          <span className="shrink-0 text-xs font-medium uppercase tracking-[0.18em] text-ink/45">
            {date}
          </span>
        )}
      </div>

      <div className="mt-2">
        <Stars value={review.rating} size={20} />
      </div>

      <blockquote className="mt-3 border-l-2 border-mc-primary pl-6">
        <p className="line-clamp-4 break-words text-lg tracking-wide leading-relaxed text-accent">
          {review.body}
        </p>
      </blockquote>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <p className="text-sm font-bold uppercase tracking-tight text-ink">
          — {name}
        </p>
        {review.variant_title && (
          <span className="inline-flex items-center border border-mc-primary/60 bg-mc-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
            Bought · {review.variant_title}
          </span>
        )}
        <span className="ml-auto text-[11px] font-bold uppercase tracking-[0.24em] text-ink/45 group-hover:text-mc-primary">
          Read note →
        </span>
      </div>
    </div>
  )

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Read review by ${name}`}
      className="group flex w-full items-start gap-6 text-left sm:gap-8"
    >
      {imageOnRight ? (
        <>
          {Body}
          {ImageBlock}
        </>
      ) : (
        <>
          {ImageBlock}
          {Body}
        </>
      )}
    </button>
  )
}

/* ───────────────── Review detail (modal body) ───────────────── */

function ReviewDetail({
  review,
  fallbackImage,
}: {
  review: Review
  fallbackImage: string
}) {
  const images = (review.images ?? []).filter(Boolean)
  const hasOwnImages = images.length > 0
  const gallery = hasOwnImages ? images : [fallbackImage]
  const [active, setActive] = useState(0)

  // Reset gallery position if the modal is reused for a different review.
  useEffect(() => {
    setActive(0)
  }, [review.id])

  const date = review.created_at
    ? new Date(review.created_at)
        .toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
        .toUpperCase()
    : ""

  const name = formatName(review.customer_name)

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px]">
      <div>
        <Stars value={review.rating} size={24} />
        <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.24em] text-ink/55">
          {review.rating}/5
          {date && <span className="ml-3 text-ink/40">· {date}</span>}
        </p>

        {review.variant_title && (
          <p className="mt-4 inline-flex items-center border border-mc-primary/60 bg-mc-primary/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-accent">
            Bought · {review.variant_title}
          </p>
        )}

        <blockquote className="mt-5 border-l-2 border-mc-primary pl-6">
          <p className="whitespace-pre-line break-words text-lg leading-relaxed tracking-wide text-accent">
            {review.body}
          </p>
        </blockquote>

        <p className="mt-6 text-sm font-bold uppercase tracking-tight text-ink">
          — {name}
        </p>

        {!hasOwnImages && (
          <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-ink/40">
            No photo provided · product imagery shown
          </p>
        )}
      </div>

      <aside className="flex flex-col gap-3">
        <div className="relative aspect-square w-full overflow-hidden border-2 border-ink bg-ink/5">
          <Image
            key={gallery[active]}
            src={gallery[active]}
            alt=""
            fill
            sizes="320px"
            className="object-cover"
          />
        </div>
        {gallery.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {gallery.map((url, idx) => (
              <button
                key={`${url}-${idx}`}
                type="button"
                onClick={() => setActive(idx)}
                aria-label={`View photo ${idx + 1}`}
                className={`relative aspect-square overflow-hidden border-2 ${
                  active === idx
                    ? "border-mc-primary"
                    : "border-ink/20 hover:border-ink"
                }`}
              >
                <Image src={url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </aside>
    </div>
  )
}

/* ───────────────── Modal shell ───────────────── */

function ReviewShell({
  open,
  onClose,
  kicker,
  title,
  ariaLabel,
  children,
  size = "default",
}: {
  open: boolean
  onClose: () => void
  kicker: string
  title: string
  ariaLabel: string
  children: ReactNode
  size?: "default" | "wide"
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null
  if (typeof document === "undefined") return null

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/55 px-4 py-12 backdrop-blur-sm sm:px-8 sm:py-16"
    >
      <div
        className={`w-full ${size === "wide" ? "max-w-4xl" : "max-w-2xl"} border-4 border-ink bg-surface shadow-[12px_12px_0_var(--mc-ink)]`}
      >
        <header className="flex items-start gap-4 border-b-4 border-ink px-8 py-6">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent">
              {kicker}
            </p>
            <h2 className="mt-1 break-words text-3xl font-black uppercase tracking-tight text-ink lg:text-4xl">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-10 w-10 place-items-center border-2 border-ink bg-surface text-2xl font-black text-ink transition hover:bg-ink hover:text-surface"
          >
            ×
          </button>
        </header>
        <div className="p-8">{children}</div>
      </div>
    </div>,
    document.body
  )
}

/* ───────────────── Form ───────────────── */

type Draft = {
  // Local preview URL (either object URL for files or the actual URL for pasted)
  preview: string
  // What gets sent to the server: either { data, mime, name } for files or { url }
  payload: ReviewImageInput
}

function ReviewForm({
  productId,
  productHandle,
  countryCode,
  variants = [],
  onCancel,
  onCreated,
}: {
  productId: string
  productHandle: string
  countryCode: string
  variants?: ProductVariantOption[]
  onCancel: () => void
  onCreated: (review: Review) => void
}) {
  const [rating, setRating] = useState(5)
  const [hover, setHover] = useState(0)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  // If the product has only one variant we still snapshot it but skip the
  // picker UI. Empty string means "no variant selected".
  const [variantId, setVariantId] = useState<string>(
    variants.length === 1 ? variants[0].id : ""
  )
  const [images, setImages] = useState<Draft[]>([])
  const [urlDraft, setUrlDraft] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [needsAuth, setNeedsAuth] = useState(false)
  const [pending, start] = useTransition()
  const fileInput = useRef<HTMLInputElement>(null)
  const dragIndex = useRef<number | null>(null)
  const [dragOver, setDragOver] = useState(false)

  // Revoke object URLs on unmount so we don't leak memory.
  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (img.preview.startsWith("blob:")) URL.revokeObjectURL(img.preview)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleFiles(filesList: FileList | File[]) {
    const arr = Array.from(filesList).filter((f) => f.type.startsWith("image/"))
    if (!arr.length) return

    const room = MAX_IMAGES - images.length
    const accept = arr.slice(0, room)
    if (accept.length < arr.length) {
      setError(`Only ${MAX_IMAGES} images allowed.`)
    }

    try {
      const drafts: Draft[] = []
      const tooLarge: string[] = []

      for (const file of accept) {
        if (file.size > MAX_RAW_BYTES) {
          tooLarge.push(file.name || "(file)")
          continue
        }
        const compressed = await compressImage(file)
        const base64 = await blobToBase64(compressed.blob)
        drafts.push({
          preview: compressed.previewUrl,
          payload: {
            data: base64,
            mime: compressed.mime,
            name: file.name,
          },
        })
      }

      if (drafts.length) {
        setImages((cur) => [...cur, ...drafts])
      }
      if (tooLarge.length) {
        const mb = Math.round(MAX_RAW_BYTES / 1024 / 1024)
        setError(
          `Too large (max ${mb}MB each): ${tooLarge.slice(0, 2).join(", ")}${
            tooLarge.length > 2 ? ` and ${tooLarge.length - 2} more` : ""
          }.`
        )
      } else if (drafts.length) {
        setError(null)
      }
    } catch (e: any) {
      setError(e?.message || "Couldn't read those images.")
    }
  }

  function addUrl() {
    const url = urlDraft.trim()
    if (!url) return
    if (images.length >= MAX_IMAGES) {
      setError(`Only ${MAX_IMAGES} images allowed.`)
      return
    }
    if (images.some((d) => "url" in d.payload && d.payload.url === url)) {
      setError("That URL is already in the list.")
      return
    }
    setImages((cur) => [
      ...cur,
      { preview: url, payload: { url } },
    ])
    setUrlDraft("")
    setError(null)
  }

  function removeAt(i: number) {
    setImages((cur) => {
      const next = cur.filter((_, idx) => idx !== i)
      const removed = cur[i]
      if (removed?.preview.startsWith("blob:"))
        URL.revokeObjectURL(removed.preview)
      return next
    })
  }

  function onTileDragStart(i: number) {
    return (e: React.DragEvent) => {
      dragIndex.current = i
      e.dataTransfer.effectAllowed = "move"
    }
  }

  function onTileDragOver(i: number) {
    return (e: React.DragEvent) => {
      e.preventDefault()
      if (dragIndex.current == null || dragIndex.current === i) return
      const from = dragIndex.current
      setImages((cur) => {
        const next = [...cur]
        const [moved] = next.splice(from, 1)
        next.splice(i, 0, moved)
        return next
      })
      dragIndex.current = i
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNeedsAuth(false)
    if (!body.trim() || body.trim().length < 2) {
      setError("Please write at least a few words.")
      return
    }
    start(async () => {
      const res = await createProductReview({
        product_id: productId,
        productHandle,
        variant_id: variantId || undefined,
        rating,
        title: title.trim() || undefined,
        body: body.trim(),
        images: images.map((d) => d.payload),
      })
      if (!res.ok) {
        if (res.needsAuth) {
          setNeedsAuth(true)
          setError(
            "Your session has expired. Please sign in again to post your review."
          )
        } else {
          setError(res.error || "Could not submit review.")
        }
        return
      }
      const picked = variants.find((v) => v.id === variantId)
      // Prefer the server's record — it carries the real reviewer name snapshot
      // and uploaded image URLs. Fall back to a local optimistic object, but
      // still keep the local image previews so they render instantly.
      const created = res.review
      onCreated(
        created
          ? {
              ...created,
              images:
                created.images && created.images.length
                  ? created.images
                  : images.map((d) => d.preview),
            }
          : {
              id: `temp_${Date.now()}`,
              product_id: productId,
              customer_id: null,
              customer_name: null,
              variant_id: picked?.id ?? null,
              variant_title: picked?.title ?? null,
              rating,
              title: title.trim() || null,
              body: body.trim(),
              images: images.map((d) => d.preview),
              status: "published",
              created_at: new Date().toISOString(),
            }
      )
    })
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <fieldset>
        <legend className="text-xs font-bold uppercase tracking-[0.18em] text-ink/55">
          Rating
        </legend>
        <div className="mt-2 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => {
            const filled = (hover || rating) >= n
            return (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                aria-label={`Rate ${n} star${n === 1 ? "" : "s"}`}
                className="grid h-11 w-11 place-items-center"
              >
                <StarIcon filled={filled} size={28} />
              </button>
            )
          })}
          <span className="ml-3 text-base font-bold text-ink/60">
            {rating}/5
          </span>
        </div>
      </fieldset>

      <label className="block">
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-ink/55">
          Title{" "}
          <span className="font-normal normal-case tracking-normal text-ink/35">
            (optional)
          </span>
        </span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder="Exceptional depth"
          className="mt-1.5 w-full border-2 border-ink/30 bg-surface px-4 py-3 text-base text-ink outline-none focus:border-ink"
        />
      </label>

      {variants.length > 1 && (
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-ink/55">
            Which one did you try?
          </span>
          <select
            value={variantId}
            onChange={(e) => setVariantId(e.target.value)}
            className="mt-1.5 w-full border-2 border-ink/30 bg-surface px-4 py-3 text-base text-ink outline-none focus:border-ink"
          >
            <option value="">— Pick a variant —</option>
            {variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.title}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="block">
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-ink/55">
          Your notes
        </span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          required
          maxLength={2000}
          placeholder="Tell other drinkers about the cup…"
          className="mt-1.5 w-full resize-y border-2 border-ink/30 bg-surface px-4 py-3 text-base leading-relaxed text-ink outline-none focus:border-ink"
        />
      </label>

      {/* Image picker */}
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink/55">
          Photos{" "}
          <span className="font-normal normal-case tracking-normal text-ink/35">
            (optional, up to {MAX_IMAGES})
          </span>
        </p>

        <div
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes("Files")) {
              e.preventDefault()
              setDragOver(true)
            }
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            setDragOver(false)
            if (e.dataTransfer.files?.length) {
              e.preventDefault()
              handleFiles(e.dataTransfer.files)
            }
          }}
          className={`mt-2 grid grid-cols-3 gap-2 border-2 border-dashed p-2 sm:grid-cols-5 ${
            dragOver ? "border-mc-primary bg-mc-primary/5" : "border-ink/25"
          }`}
        >
          {images.length === 0 && (
            <div className="col-span-full grid h-24 place-items-center text-xs text-ink/45">
              Drop photos here, choose files, or paste an image URL below.
            </div>
          )}
          {images.map((img, i) => (
            <div
              key={`${img.preview}-${i}`}
              draggable
              onDragStart={onTileDragStart(i)}
              onDragOver={onTileDragOver(i)}
              onDragEnd={() => (dragIndex.current = null)}
              className="group relative aspect-square cursor-grab overflow-hidden border-2 border-ink/30 active:cursor-grabbing"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.preview}
                alt=""
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label="Remove photo"
                className="absolute right-1 top-1 hidden h-6 w-6 place-items-center border border-ink bg-surface text-ink group-hover:grid hover:bg-red-100 hover:text-red-700"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 2l8 8M10 2L2 10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="square"
                  />
                </svg>
              </button>
              <span className="absolute bottom-1 left-1 border border-ink/40 bg-surface/90 px-1 font-mono text-[10px] text-ink/70">
                {i + 1}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          <input
            type="url"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                addUrl()
              }
            }}
            placeholder="https://image-url…"
            className="flex-1 min-w-[200px] border-2 border-ink/30 bg-surface px-3 py-2 text-sm outline-none focus:border-ink"
          />
          <button
            type="button"
            onClick={addUrl}
            disabled={!urlDraft.trim() || images.length >= MAX_IMAGES}
            className="border-2 border-ink/30 px-3 py-2 font-display text-[10px] font-bold uppercase tracking-[0.18em] text-ink/65 hover:border-ink hover:text-ink disabled:opacity-40"
          >
            Add URL
          </button>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={images.length >= MAX_IMAGES}
            className="border-2 border-ink bg-ink px-3 py-2 font-display text-[10px] font-bold uppercase tracking-[0.18em] text-surface hover:bg-accent hover:border-accent disabled:opacity-40"
          >
            Choose files
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files?.length) handleFiles(e.target.files)
              e.target.value = ""
            }}
          />
        </div>
        <p className="mt-1 text-[11px] text-ink/45">
          Drag tiles to reorder. The first photo is the cover for your review.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-x-3 gap-y-1 border-l-4 border-red-700 bg-red-50 px-3 py-2 text-sm font-bold uppercase tracking-[0.14em] text-red-700"
        >
          <span>{error}</span>
          {needsAuth && (
            <Link
              href={`/${countryCode}/auth/login?returnTo=${encodeURIComponent(
                `/${countryCode}/products/${productHandle}#reviews`
              )}`}
              className="underline underline-offset-2 hover:text-red-900"
            >
              Sign in
            </Link>
          )}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="border-2 border-ink/30 px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-ink/65 hover:border-ink hover:text-ink disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="border-2 border-ink bg-ink px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-surface hover:bg-accent hover:border-accent disabled:opacity-60"
        >
          {pending ? "Posting…" : "Post review"}
        </button>
      </div>
    </form>
  )
}

/* ───────────────── Image helpers ───────────────── */

// Resize + recompress to keep the eventual base64 payload small enough that
// 5 photos comfortably fit inside the server's 12mb body limit. Pass through
// GIFs and SVGs untouched — canvas can't reproduce them faithfully.
async function compressImage(
  file: File
): Promise<{ blob: Blob; mime: string; previewUrl: string }> {
  if (file.type === "image/gif" || file.type === "image/svg+xml") {
    return {
      blob: file,
      mime: file.type,
      previewUrl: URL.createObjectURL(file),
    }
  }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    // Browser couldn't decode (HEIC, corrupt, etc.) — fall back to the raw file.
    return {
      blob: file,
      mime: file.type || "image/jpeg",
      previewUrl: URL.createObjectURL(file),
    }
  }

  const longest = Math.max(bitmap.width, bitmap.height)
  const scale = Math.min(1, COMPRESS_MAX_EDGE / longest)
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    bitmap.close?.()
    return {
      blob: file,
      mime: file.type || "image/jpeg",
      previewUrl: URL.createObjectURL(file),
    }
  }
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close?.()

  // Prefer JPEG for everything except pristine PNGs (graphics/text); even those
  // get JPEG'd if they're large enough that the size win is worth losing alpha.
  const keepPng = file.type === "image/png" && w * h <= 800_000
  const mime = keepPng ? "image/png" : "image/jpeg"
  const quality = keepPng ? undefined : COMPRESS_QUALITY

  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Image compression failed."))),
      mime,
      quality
    )
  )

  return {
    blob,
    mime,
    previewUrl: URL.createObjectURL(blob),
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const r = reader.result
      if (typeof r !== "string") {
        reject(new Error("Could not encode image."))
        return
      }
      resolve(r.replace(/^data:[^;]+;base64,/, ""))
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

/* ───────────────── Atoms ───────────────── */

function formatName(raw?: string | null) {
  if (!raw) return "Anonymous"
  const parts = raw.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "Anonymous"
  const first = parts[0]
  const last = parts[1]
  if (!last) return first.toUpperCase()
  return `${first.toUpperCase()} ${last.charAt(0).toUpperCase()}.`
}

function Stars({ value, size = 20 }: { value: number; size?: number }) {
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`Rated ${value} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon
          key={n}
          filled={value >= n - 0.25}
          half={value >= n - 0.75 && value < n - 0.25}
          size={size}
        />
      ))}
    </div>
  )
}

function StarIcon({
  filled,
  half,
  size = 20,
}: {
  filled: boolean
  half?: boolean
  size?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      className={filled ? "text-mc-primary" : "text-ink/20"}
    >
      <defs>
        <linearGradient id="reviewHalfStar">
          <stop offset="50%" stopColor="currentColor" />
          <stop offset="50%" stopColor="transparent" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14 2 9.27l6.91-1.01z"
        fill={
          filled ? "currentColor" : half ? "url(#reviewHalfStar)" : "none"
        }
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

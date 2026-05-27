"use client"

import { HttpTypes } from "@medusajs/types"
import { useState } from "react"

type TrackingProps = {
  order: HttpTypes.StoreOrder
}

type FulfillmentLike = {
  shipped_at?: string | Date | null
  delivered_at?: string | Date | null
  canceled_at?: string | Date | null
  packed_at?: string | Date | null
  created_at?: string | Date | null
  data?: Record<string, unknown> | null
  labels?: Array<{
    tracking_number?: string | null
    tracking_url?: string | null
  }> | null
}

type ShipmozoData = {
  awb_number?: string
  courier?: string
  current_status?: string
  status_time?: string
  tracking_url?: string
  reference_id?: string
}

type StageKey =
  | "placed"
  | "confirmed"
  | "shipped"
  | "out_for_delivery"
  | "delivered"

type Stage = {
  key: StageKey
  label: string
  caption: string
  reachedAt: Date | null
  state: "done" | "current" | "pending" | "skipped"
}

const STAGE_DEFS: Array<{ key: StageKey; label: string; caption: string }> = [
  { key: "placed", label: "Placed", caption: "Order received" },
  { key: "confirmed", label: "Confirmed", caption: "Roastery notified" },
  { key: "shipped", label: "Shipped", caption: "Picked up by courier" },
  {
    key: "out_for_delivery",
    label: "Out for Delivery",
    caption: "With your local rider",
  },
  { key: "delivered", label: "Delivered", caption: "At your door" },
]

const toDate = (value: string | Date | null | undefined): Date | null => {
  if (!value) return null
  const d = typeof value === "string" ? new Date(value) : value
  return Number.isNaN(d.getTime()) ? null : d
}

const formatDateShort = (d: Date | null) =>
  d
    ? d.toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        hour: "numeric",
        minute: "2-digit",
      })
    : null

const formatDateLong = (d: Date | null) =>
  d
    ? d.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null

const titleCase = (str: string) =>
  str
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((p) => p.slice(0, 1).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ")

const inferStageFromStatus = (raw: string | undefined): StageKey | null => {
  if (!raw) return null
  const s = raw.toLowerCase()
  if (s.includes("deliver") && !s.includes("out")) return "delivered"
  if (s.includes("out for") || s.includes("out-for")) return "out_for_delivery"
  if (
    s.includes("in transit") ||
    s.includes("transit") ||
    s.includes("manifest") ||
    s.includes("dispatched") ||
    s.includes("shipped") ||
    s.includes("pickup")
  )
    return "shipped"
  if (s.includes("confirm") || s.includes("processed")) return "confirmed"
  if (s.includes("placed") || s.includes("received")) return "placed"
  return null
}

const buildStages = (
  order: HttpTypes.StoreOrder,
  fulfillment: FulfillmentLike | undefined,
  shipmozo: ShipmozoData
): Stage[] => {
  const placedAt = toDate(order.created_at as string | Date | null | undefined)
  const confirmedAt = toDate(
    fulfillment?.packed_at ?? fulfillment?.created_at ?? null
  )
  const shippedAt = toDate(fulfillment?.shipped_at ?? null)
  const deliveredAt = toDate(fulfillment?.delivered_at ?? null)
  const statusTime = toDate(shipmozo.status_time ?? null)
  const inferred = inferStageFromStatus(shipmozo.current_status)

  const isOFD =
    inferred === "out_for_delivery" ||
    (!!shipmozo.current_status &&
      shipmozo.current_status.toLowerCase().includes("out for"))

  const reachedByDefault: Record<StageKey, Date | null> = {
    placed: placedAt,
    confirmed: confirmedAt,
    shipped: shippedAt ?? (shipmozo.awb_number ? statusTime : null),
    out_for_delivery: isOFD ? statusTime : null,
    delivered: deliveredAt,
  }

  // Determine current stage: the latest one with a reachedAt OR the inferred
  // stage from a live shipmozo status update.
  const inferredIdx = inferred
    ? STAGE_DEFS.findIndex((s) => s.key === inferred)
    : -1
  let currentIdx = -1
  STAGE_DEFS.forEach((def, idx) => {
    if (reachedByDefault[def.key]) currentIdx = Math.max(currentIdx, idx)
  })
  if (inferredIdx > currentIdx) currentIdx = inferredIdx

  return STAGE_DEFS.map((def, idx) => {
    const reached = reachedByDefault[def.key]
    let state: Stage["state"]
    if (reached || idx < currentIdx) state = "done"
    else if (idx === currentIdx) state = "current"
    else state = "pending"
    return {
      key: def.key,
      label: def.label,
      caption: def.caption,
      reachedAt: reached,
      state,
    }
  })
}

const Tracking = ({ order }: TrackingProps) => {
  const fulfillment = (order.fulfillments?.[0] ?? undefined) as
    | FulfillmentLike
    | undefined
  const shipmozo =
    (fulfillment?.data?.shipmozo as ShipmozoData | undefined) ?? {}
  const label = fulfillment?.labels?.[0]

  const trackingNumber = label?.tracking_number ?? shipmozo.awb_number ?? null
  const trackingUrl = label?.tracking_url ?? shipmozo.tracking_url ?? null
  const courier = shipmozo.courier ?? null

  const isCanceled = !!fulfillment?.canceled_at || !!order.canceled_at
  const stages = buildStages(order, fulfillment, shipmozo)
  const currentStage = stages.find((s) => s.state === "current")
  const lastDone = [...stages].reverse().find((s) => s.state === "done")

  const headline = isCanceled
    ? "Order cancelled."
    : stages[stages.length - 1].state === "done"
    ? "Your coffee has landed."
    : currentStage?.key === "out_for_delivery"
    ? "Out for delivery today."
    : currentStage?.key === "shipped"
    ? "On the road."
    : currentStage?.key === "confirmed"
    ? "Roasted & packed."
    : "Order in the queue."

  const headlineCaption = isCanceled
    ? "We have refunded any captured payment for this order."
    : currentStage?.caption ?? lastDone?.caption ?? "Sit tight — we'll keep you posted."

  const lastUpdate =
    currentStage?.reachedAt ??
    lastDone?.reachedAt ??
    (shipmozo.status_time ? toDate(shipmozo.status_time) : null)

  const [copied, setCopied] = useState(false)
  const copyAwb = async () => {
    if (!trackingNumber) return
    try {
      await navigator.clipboard.writeText(trackingNumber)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // noop — clipboard may be blocked
    }
  }

  return (
    <div className="flex flex-col gap-7">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xl">
          <div className="flex items-center gap-3">
            <span className="inline-block h-2 w-2 rounded-full bg-accent" />
            <span className="font-family-heading text-[11px] font-bold uppercase tracking-[0.22em] text-accent">
              Bulletin · Shipment
            </span>
          </div>
          <h2
            className="mt-3 font-family-heading text-[clamp(2rem,4.6vw,3.6rem)] font-black uppercase leading-[0.92] tracking-tight text-ink"
            data-testid="tracking-headline"
          >
            {headline}
          </h2>
          <p className="mt-3 font-family-base text-sm text-ink/65 sm:text-base">
            {headlineCaption}
          </p>
        </div>

        <div className="flex flex-col items-start gap-3 sm:items-end">
          <span
            className={`inline-flex items-center border-2 px-3 py-1 font-family-heading text-[11px] font-bold uppercase tracking-[0.14em] ${
              isCanceled
                ? "border-red-700 bg-red-50 text-red-700"
                : currentStage?.key === "delivered"
                ? "border-emerald-700 bg-emerald-50 text-emerald-800"
                : "border-accent bg-[rgb(var(--mc-primary-rgb)/0.18)] text-accent"
            }`}
            data-testid="tracking-status"
          >
            {isCanceled
              ? "Cancelled"
              : titleCase(shipmozo.current_status ?? currentStage?.label ?? "Pending")}
          </span>
          {lastUpdate && (
            <span className="font-family-base text-[11px] uppercase tracking-[0.14em] text-ink/45">
              Updated {formatDateShort(lastUpdate)}
            </span>
          )}
          {!isCanceled && (
            <span
              className="group inline-flex items-center gap-2 border border-ink/15 bg-ink/[0.03] px-2.5 py-1 font-family-heading text-[10px] font-bold uppercase tracking-[0.22em] text-ink/55"
              aria-label="Live tracking"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              Live
            </span>
          )}
        </div>
      </div>

      {/* ── Body: timeline on the left, courier/CTA panel on the right ── */}
      <div className="grid grid-cols-1 gap-7 lg:grid-cols-[1fr_320px] lg:gap-10">
        <TrackingTimeline stages={stages} canceled={isCanceled} />

        {/* Side panel — borders adapt: dashed top on mobile, dashed left on lg */}
        <div className="border-t-2 border-dashed border-ink/15 pt-6 lg:border-l-2 lg:border-t-0 lg:pl-8 lg:pt-0">
          <p className="font-family-heading text-[10px] font-bold uppercase tracking-[0.22em] text-ink/45">
            Shipment Details
          </p>
          <div className="mt-5 flex flex-col gap-5">
            <Field label="Courier" value={courier ?? "Assigning"} />
            <Field
              label="AWB / Tracking"
              value={
                trackingNumber ? (
                  <button
                    type="button"
                    onClick={copyAwb}
                    className="group inline-flex items-center gap-2 font-mono text-base font-medium tabular-nums text-ink hover:text-accent"
                    title="Click to copy"
                  >
                    <span>{trackingNumber}</span>
                    <span className="font-family-heading text-[10px] uppercase tracking-[0.18em] text-ink/35 group-hover:text-accent">
                      {copied ? "Copied" : "Copy"}
                    </span>
                  </button>
                ) : (
                  <span className="font-family-base text-base text-ink/45">
                    Pending
                  </span>
                )
              }
            />
            <Field
              label="Reference"
              value={
                <span className="font-mono text-base tabular-nums text-ink">
                  #{order.display_id}
                </span>
              }
            />
          </div>

          <div className="mt-7">
            {trackingUrl ? (
              <a
                href={trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex w-full items-center justify-between gap-3 border-2 border-ink bg-ink px-5 py-3 font-family-heading text-sm font-bold uppercase tracking-[0.1em] text-surface shadow-[4px_4px_0px_0px_var(--mc-accent)] transition-[transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_var(--mc-accent)]"
                data-testid="tracking-link"
              >
                <span>Open Live Tracking</span>
                <span aria-hidden className="text-base">↗</span>
              </a>
            ) : (
              <span className="inline-flex w-full items-center justify-center border-2 border-dashed border-ink/30 px-5 py-3 font-family-heading text-[11px] font-bold uppercase tracking-[0.12em] text-ink/55">
                Tracking link unlocks on pickup
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const Field = ({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) => (
  <div className="flex flex-col gap-1">
    <span className="font-family-heading text-[10px] font-bold uppercase tracking-[0.18em] text-ink/40">
      {label}
    </span>
    <div className="font-family-base text-base text-ink">{value}</div>
  </div>
)

const TrackingTimeline = ({
  stages,
  canceled,
}: {
  stages: Stage[]
  canceled: boolean
}) => {
  return (
    <ol className="relative">
      {stages.map((stage, idx) => {
        const isLast = idx === stages.length - 1
        const nextState = !isLast ? stages[idx + 1].state : null
        const lineDone =
          stage.state === "done" &&
          (nextState === "done" || nextState === "current")

        return (
          <li
            key={stage.key}
            className="relative flex gap-5 pb-7 last:pb-0 sm:gap-6"
            data-state={stage.state}
            data-testid={`stage-${stage.key}`}
          >
            {/* Vertical connector — 2px line centered on 28px marker */}
            {!isLast && (
              <span
                aria-hidden
                className={`absolute left-[13px] top-8 h-[calc(100%-1.5rem)] ${
                  canceled
                    ? "border-l-2 border-ink/15"
                    : lineDone
                    ? "w-[2px] bg-accent"
                    : "border-l-2 border-dashed border-ink/20"
                }`}
              />
            )}

            <StageMarker state={stage.state} canceled={canceled} />

            <div className="flex flex-1 flex-col gap-1 pt-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
              <div className="min-w-0">
                <p
                  className={`font-family-heading text-[12px] font-bold uppercase tracking-[0.16em] sm:text-[13px] ${
                    canceled
                      ? "text-ink/35"
                      : stage.state === "pending"
                      ? "text-ink/35"
                      : stage.state === "current"
                      ? "text-accent"
                      : "text-ink"
                  }`}
                >
                  {stage.label}
                </p>
                <p
                  className={`mt-1 font-family-base text-[13px] ${
                    stage.state === "pending" || canceled
                      ? "text-ink/40"
                      : "text-ink/65"
                  }`}
                >
                  {stage.caption}
                </p>
              </div>
              <span
                className={`shrink-0 font-mono text-[11px] uppercase tabular-nums tracking-[0.06em] sm:text-[12px] ${
                  stage.reachedAt ? "text-ink/65" : "text-ink/30"
                }`}
              >
                {stage.reachedAt ? formatDateShort(stage.reachedAt) : "—"}
              </span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

const StageMarker = ({
  state,
  canceled,
}: {
  state: Stage["state"]
  canceled: boolean
}) => {
  const isCurrent = state === "current" && !canceled
  const isDone = state === "done" && !canceled

  return (
    <span
      aria-hidden
      className={`relative z-[1] flex h-7 w-7 items-center justify-center border-2 ${
        canceled
          ? "border-ink/25 bg-surface text-ink/25"
          : isDone
          ? "border-accent bg-accent text-surface"
          : isCurrent
          ? "border-accent bg-surface text-accent"
          : "border-ink/30 bg-surface text-ink/40"
      }`}
    >
      {isCurrent && (
        <span className="absolute inset-0 animate-ping border-2 border-accent opacity-60" />
      )}
      <span className="font-family-heading text-[10px] font-black leading-none">
        {canceled ? "×" : isDone ? "✓" : isCurrent ? "●" : ""}
      </span>
    </span>
  )
}

export default Tracking

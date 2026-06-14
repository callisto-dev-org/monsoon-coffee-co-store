import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Text,
  toast,
} from "@medusajs/ui"
import { useCallback, useEffect, useRef, useState } from "react"

import { adminFetch } from "../../components/event-detail-editor"

// ── Door check-in page ──────────────────────────────────────────────────────
// Two ways to verify a ticket, both resolving to the same code:
//   1. QR — scan with the in-app camera, OR with any phone camera (the QR
//      encodes a link to this page with ?code= pre-filled).
//   2. Code — type the MC-EVT-… code by hand.
// Verify first (no mutation), then tap "Check in" to mark the ticket used.

type Ticket = {
  code: string
  event_title?: string | null
  order_display_id?: string | null
  email?: string | null
  status?: "valid" | "checked_in" | "void"
  checked_in_at?: string | null
  checked_in_by?: string | null
}

type ViewKind =
  | "idle"
  | "loading"
  | "not_found"
  | "valid"
  | "checked_in"
  | "void"
  | "just_checked_in"

type View = { kind: ViewKind; code: string; ticket?: Ticket | null }

const fmt = (v?: string | null) =>
  v
    ? new Date(v).toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        hour: "numeric",
        minute: "2-digit",
      })
    : null

// Theme-aware status styling: a neutral admin surface for the card, with the
// status conveyed by a colored label + badge (Medusa UI tag tokens adapt to
// light/dark). No hardcoded white/green backgrounds.
type BadgeColor = "green" | "orange" | "red" | "grey"
const TONE: Record<ViewKind, { label: string; badge: BadgeColor; text: string }> = {
  idle: { label: "", badge: "grey", text: "text-ui-fg-base" },
  loading: { label: "Checking…", badge: "grey", text: "text-ui-fg-subtle" },
  valid: { label: "Valid ticket", badge: "green", text: "text-ui-tag-green-text" },
  just_checked_in: { label: "Checked in ✓", badge: "green", text: "text-ui-tag-green-text" },
  checked_in: { label: "Already checked in", badge: "orange", text: "text-ui-tag-orange-text" },
  void: { label: "Void / revoked", badge: "red", text: "text-ui-tag-red-text" },
  not_found: { label: "Ticket not found", badge: "red", text: "text-ui-tag-red-text" },
}

const TicketVerifyPage = () => {
  const [code, setCode] = useState("")
  const [view, setView] = useState<View>({ kind: "idle", code: "" })
  const [busy, setBusy] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanSupported, setScanSupported] = useState(true)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const loopRef = useRef<number | null>(null)
  const detectorRef = useRef<{ detect: (s: unknown) => Promise<Array<{ rawValue: string }>> } | null>(null)

  const verify = useCallback(async (raw: string) => {
    const value = raw.trim()
    if (!value) return
    setBusy(true)
    setView({ kind: "loading", code: value })
    try {
      const res = await adminFetch<{
        ticket: Ticket | null
        found: boolean
        code: string
      }>(`/admin/event-tickets?code=${encodeURIComponent(value)}`)
      if (!res.found || !res.ticket) {
        setView({ kind: "not_found", code: res.code || value })
        return
      }
      const status = res.ticket.status ?? "valid"
      setView({
        kind:
          status === "checked_in"
            ? "checked_in"
            : status === "void"
            ? "void"
            : "valid",
        code: res.ticket.code,
        ticket: res.ticket,
      })
    } catch (e) {
      toast.error("Lookup failed", { description: (e as Error).message })
      setView({ kind: "idle", code: value })
    } finally {
      setBusy(false)
    }
  }, [])

  const checkIn = useCallback(async (raw: string) => {
    const value = raw.trim()
    if (!value) return
    setBusy(true)
    try {
      const res = await adminFetch<{ result: string; ticket: Ticket | null }>(
        `/admin/event-tickets/check-in`,
        { method: "POST", body: JSON.stringify({ code: value }) }
      )
      const map: Record<string, ViewKind> = {
        checked_in: "just_checked_in",
        already_checked_in: "checked_in",
        void: "void",
        not_found: "not_found",
      }
      const kind = map[res.result] ?? "valid"
      setView({ kind, code: res.ticket?.code ?? value, ticket: res.ticket })
      if (kind === "just_checked_in") toast.success("Ticket checked in")
      else if (kind === "checked_in")
        toast.warning("Already checked in", {
          description: fmt(res.ticket?.checked_in_at) ?? undefined,
        })
      else if (kind === "not_found") toast.error("Ticket not found")
      else if (kind === "void") toast.error("Ticket is void")
    } catch (e) {
      toast.error("Check-in failed", { description: (e as Error).message })
    } finally {
      setBusy(false)
    }
  }, [])

  // ── Camera scanning (native BarcodeDetector) ──
  const stopScan = useCallback(() => {
    if (loopRef.current) {
      window.clearTimeout(loopRef.current)
      loopRef.current = null
    }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setScanning(false)
  }, [])

  const startScan = useCallback(async () => {
    const BD = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => { detect: (s: unknown) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector
    if (!BD) {
      setScanSupported(false)
      toast.info("In-app scanner unavailable", {
        description:
          "This browser can't scan in-app. Use a phone camera on the QR, or type the code.",
      })
      return
    }
    try {
      detectorRef.current = new BD({ formats: ["qr_code"] })
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      streamRef.current = stream
      setScanning(true)
      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        await video.play().catch(() => {})
      }
      const tick = async () => {
        if (!detectorRef.current || !videoRef.current) return
        try {
          const codes = await detectorRef.current.detect(videoRef.current)
          if (codes[0]?.rawValue) {
            const found = codes[0].rawValue
            stopScan()
            setCode(found)
            verify(found)
            return
          }
        } catch {
          /* transient detect error — keep looping */
        }
        loopRef.current = window.setTimeout(tick, 350)
      }
      loopRef.current = window.setTimeout(tick, 400)
    } catch (e) {
      toast.error("Camera unavailable", { description: (e as Error).message })
      stopScan()
    }
  }, [stopScan, verify])

  // Deep link: a phone-camera scan opens /app/ticket-verify?code=… — auto-verify.
  useEffect(() => {
    const url = new URL(window.location.href)
    const c = url.searchParams.get("code")
    if (c) {
      setCode(c)
      verify(c)
    }
    return () => stopScan()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const tone = TONE[view.kind]
  const t = view.ticket

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h1">Ticket Check-in</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Scan a ticket QR or enter its code to verify and admit.
        </Text>
      </div>

      {/* Input row */}
      <div className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Text size="small" weight="plus" className="mb-1">
            Ticket code
          </Text>
          <Input
            placeholder="MC-EVT-…"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") verify(code)
            }}
            autoFocus
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            disabled={busy || !code.trim()}
            onClick={() => verify(code)}
          >
            Verify
          </Button>
          <Button
            variant="primary"
            disabled={busy || !code.trim()}
            onClick={() => checkIn(code)}
          >
            Check in
          </Button>
        </div>
      </div>

      {/* Scanner */}
      <div className="px-6 py-5">
        <div className="mb-3 flex items-center justify-between">
          <Text size="small" weight="plus">
            Camera scanner
          </Text>
          {scanning ? (
            <Button variant="secondary" size="small" onClick={stopScan}>
              Stop
            </Button>
          ) : (
            <Button variant="secondary" size="small" onClick={startScan}>
              Start camera
            </Button>
          )}
        </div>
        <div
          className="relative overflow-hidden rounded-lg bg-ui-bg-subtle"
          style={{ aspectRatio: "16 / 10", maxWidth: 520 }}
        >
          <video
            ref={videoRef}
            muted
            playsInline
            className="h-full w-full object-cover"
            style={{ display: scanning ? "block" : "none" }}
          />
          {!scanning && (
            <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
              <Text size="small" className="text-ui-fg-subtle">
                {scanSupported
                  ? "Start the camera and point it at the ticket QR. You can also scan with a phone camera — it opens this page with the code filled in."
                  : "In-app scanning isn't supported here. Scan the QR with a phone camera, or type the code above."}
              </Text>
            </div>
          )}
          {scanning && (
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 border-ui-fg-on-color"
              style={{ width: "60%", height: "60%", boxShadow: "0 0 0 9999px rgba(0,0,0,0.25)" }}
            />
          )}
        </div>
      </div>

      {/* Result */}
      {view.kind !== "idle" && (
        <div className="px-6 py-6">
          <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-5">
            <div className="flex items-center justify-between gap-3">
              <span className={`font-sans text-lg font-semibold ${tone.text}`}>
                {tone.label}
              </span>
              <Badge size="small" color={tone.badge}>
                {view.code}
              </Badge>
            </div>

            {t && (
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Detail label="Event" value={t.event_title ?? "—"} />
                <Detail
                  label="Order"
                  value={t.order_display_id ? `#${t.order_display_id}` : "—"}
                />
                <Detail label="Buyer" value={t.email ?? "—"} />
                <Detail
                  label="Checked in"
                  value={
                    t.checked_in_at
                      ? `${fmt(t.checked_in_at)}${
                          t.checked_in_by ? ` · ${t.checked_in_by}` : ""
                        }`
                      : "—"
                  }
                />
              </div>
            )}

            {view.kind === "valid" && (
              <div className="mt-4">
                <Button
                  variant="primary"
                  disabled={busy}
                  onClick={() => checkIn(view.code)}
                >
                  Admit — check in
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </Container>
  )
}

const Detail = ({ label, value }: { label: string; value: string }) => (
  <div>
    <Text size="xsmall" className="opacity-70">
      {label}
    </Text>
    <Text size="small" weight="plus" className="break-words">
      {value}
    </Text>
  </div>
)

export const config = defineRouteConfig({
  label: "Ticket Check-in",
})

export default TicketVerifyPage

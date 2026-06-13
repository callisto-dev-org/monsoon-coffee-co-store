import {
  Button,
  Input,
  Label,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useEffect, useState } from "react"

// Shared event editor used by both the product-detail widget and the standalone
// Events admin page. Reads/writes /admin/products/:id/event-detail.

export type EventDetail = {
  id?: string
  product_id?: string
  partner?: string | null
  venue?: string | null
  city?: string | null
  date_label?: string | null
  event_date?: string | null
  seats_total?: number | null
  description?: string | null
  highlights?: string[] | null
  images?: string[] | null
}

type UploadResponse = { files?: Array<{ id?: string; url?: string }> }

// Uploads files through the Medusa admin file module and returns their URLs.
async function uploadFiles(files: FileList | File[]): Promise<string[]> {
  const body = new FormData()
  Array.from(files).forEach((f) => body.append("files", f))
  const res = await fetch("/admin/uploads", {
    credentials: "include",
    method: "POST",
    body,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`HTTP ${res.status}: ${text}`)
  }
  const json = (await res.json()) as UploadResponse
  return (json.files ?? [])
    .map((f) => f.url)
    .filter((u): u is string => Boolean(u))
}

export async function adminFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      ...(init?.headers ?? {}),
    },
    ...init,
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`HTTP ${res.status}: ${body}`)
  }
  return (await res.json()) as T
}

function emptyToNull(v: string | null | undefined): string | null {
  const t = (v ?? "").trim()
  return t ? t : null
}

const ordinal = (n: number): string => {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}

// "2026-07-05" -> "Sunday, July 5th" (the human label shown on the storefront).
function formatDateLabel(yyyyMmDd: string): string | null {
  if (!yyyyMmDd) return null
  const d = new Date(`${yyyyMmDd}T00:00:00`)
  if (Number.isNaN(d.getTime())) return null
  const weekday = d.toLocaleDateString("en-US", { weekday: "long" })
  const month = d.toLocaleDateString("en-US", { month: "long" })
  const day = d.getDate()
  return `${weekday}, ${month} ${day}${ordinal(day)}`
}

const Field = ({
  label,
  children,
  colSpan,
}: {
  label: string
  children: React.ReactNode
  colSpan?: boolean
}) => (
  <div className={colSpan ? "md:col-span-2" : undefined}>
    <Label className="mb-1 block">{label}</Label>
    {children}
  </div>
)

export const EventEditor = ({ productId }: { productId: string }) => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<EventDetail>({})
  const [eventDate, setEventDate] = useState("") // YYYY-MM-DD from the picker
  const [highlights, setHighlights] = useState<string[]>([])
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  const set = (patch: Partial<EventDetail>) =>
    setForm((prev) => ({ ...prev, ...patch }))

  async function load() {
    setLoading(true)
    try {
      const res = await adminFetch<{ event_detail: EventDetail | null }>(
        `/admin/products/${productId}/event-detail`
      )
      const d = res.event_detail ?? {}
      setForm({
        partner: d.partner ?? "",
        venue: d.venue ?? "",
        city: d.city ?? "",
        seats_total: d.seats_total ?? null,
        description: d.description ?? "",
      })
      setEventDate(d.event_date ? d.event_date.slice(0, 10) : "")
      setHighlights(
        Array.isArray(d.highlights) ? (d.highlights as string[]) : []
      )
      setImages(Array.isArray(d.images) ? (d.images as string[]) : [])
    } catch (e) {
      toast.error("Failed to load event detail", {
        description: (e as Error).message,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  async function save() {
    setSaving(true)
    try {
      const cleanedHighlights = highlights.map((h) => h.trim()).filter(Boolean)
      const date = eventDate.trim()
      await adminFetch(`/admin/products/${productId}/event-detail`, {
        method: "POST",
        body: JSON.stringify({
          partner: emptyToNull(form.partner),
          venue: emptyToNull(form.venue),
          city: emptyToNull(form.city),
          // Date picker is the single source of truth — we derive the human
          // label shown on the storefront from it.
          event_date: date
            ? new Date(`${date}T00:00:00.000Z`).toISOString()
            : null,
          date_label: date ? formatDateLabel(date) : null,
          seats_total:
            form.seats_total === null || form.seats_total === undefined
              ? null
              : Number(form.seats_total),
          description: emptyToNull(form.description),
          highlights: cleanedHighlights.length ? cleanedHighlights : null,
          images: images.length ? images : null,
        }),
      })
      toast.success("Event detail saved")
      load()
    } catch (e) {
      toast.error("Save failed", { description: (e as Error).message })
    } finally {
      setSaving(false)
    }
  }

  async function onPickImages(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const urls = await uploadFiles(files)
      setImages((prev) => [...prev, ...urls])
      toast.success(`Uploaded ${urls.length} image${urls.length === 1 ? "" : "s"}`)
    } catch (e) {
      toast.error("Upload failed", { description: (e as Error).message })
    } finally {
      setUploading(false)
    }
  }

  async function clearAll() {
    if (!confirm("Remove all event details for this product?")) return
    try {
      await adminFetch(`/admin/products/${productId}/event-detail`, {
        method: "DELETE",
      })
      toast.success("Event detail removed")
      setForm({})
      setEventDate("")
      setHighlights([])
      setImages([])
      load()
    } catch (e) {
      toast.error("Remove failed", { description: (e as Error).message })
    }
  }

  return (
    <div className="divide-y">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Text size="small" className="text-ui-fg-muted">
            Venue, date, seats and what&apos;s in store for this event.
          </Text>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="small"
            onClick={clearAll}
            disabled={loading || saving}
          >
            Clear
          </Button>
          <Button size="small" onClick={save} disabled={loading} isLoading={saving}>
            Save
          </Button>
        </div>
      </div>

      {loading ? (
        <Text className="px-6 py-6 text-ui-fg-muted">Loading…</Text>
      ) : (
        <div className="grid grid-cols-1 gap-3 px-6 py-4 md:grid-cols-2">
          <Field label="Partner / collaborator (optional)">
            <Input
              value={form.partner ?? ""}
              onChange={(e) => set({ partner: e.target.value })}
              placeholder="Brun Coffee"
            />
          </Field>
          <Field label="Date">
            <Input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </Field>
          <Field label="Venue">
            <Input
              value={form.venue ?? ""}
              onChange={(e) => set({ venue: e.target.value })}
              placeholder="Vinyl & Brew"
            />
          </Field>
          <Field label="City">
            <Input
              value={form.city ?? ""}
              onChange={(e) => set({ city: e.target.value })}
              placeholder="Chennai"
            />
          </Field>
          <Field label="Seats (limit)">
            <Input
              type="number"
              min={0}
              value={form.seats_total ?? ""}
              onChange={(e) =>
                set({
                  seats_total:
                    e.target.value === "" ? null : Number(e.target.value),
                })
              }
              placeholder="25"
            />
          </Field>
          <Field label="Description (Markdown supported)" colSpan>
            <Textarea
              value={form.description ?? ""}
              onChange={(e) => set({ description: e.target.value })}
              placeholder={
                "Come spend a Sunday morning…\n\nUse **bold**, _italics_, lists and ## headings — rendered on the storefront."
              }
              rows={6}
            />
          </Field>

          {/* Images */}
          <div className="md:col-span-2">
            <div className="mb-1 flex items-center justify-between">
              <Label>Images</Label>
              <label className="cursor-pointer text-sm text-ui-fg-interactive">
                {uploading ? "Uploading…" : "+ Upload"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    onPickImages(e.target.files)
                    e.target.value = ""
                  }}
                />
              </label>
            </div>
            {images.length === 0 ? (
              <Text size="small" className="text-ui-fg-muted">
                No images yet — upload event photos or posters.
              </Text>
            ) : (
              <div className="flex flex-wrap gap-3">
                {images.map((url, i) => (
                  <div
                    key={`${url}-${i}`}
                    className="relative h-24 w-24 overflow-hidden rounded-md border border-ui-border-base"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Event image ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setImages((arr) => arr.filter((_, idx) => idx !== i))
                      }
                      className="absolute right-1 top-1 rounded-full bg-ui-bg-base/90 px-1.5 text-xs text-ui-fg-error shadow"
                      aria-label="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <div className="mb-1 flex items-center justify-between">
              <Label>What&apos;s in store</Label>
              <Button
                variant="transparent"
                size="small"
                onClick={() => setHighlights((h) => [...h, ""])}
              >
                + Add item
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              {highlights.length === 0 && (
                <Text size="small" className="text-ui-fg-muted">
                  No highlights yet — add the bullet points for this event.
                </Text>
              )}
              {highlights.map((h, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={h}
                    onChange={(e) =>
                      setHighlights((arr) =>
                        arr.map((x, idx) => (idx === i ? e.target.value : x))
                      )
                    }
                    placeholder="Hands-on brewing across multiple methods…"
                  />
                  <Button
                    variant="transparent"
                    size="small"
                    className="text-ui-fg-error"
                    onClick={() =>
                      setHighlights((arr) => arr.filter((_, idx) => idx !== i))
                    }
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Text,
  Textarea,
  Select,
  toast,
} from "@medusajs/ui"
import { useEffect, useState } from "react"

type ExtractionPoint = {
  time_s: number
  yield_g: number
  tds?: number | null
}

type CoffeeProfile = {
  id?: string
  product_id?: string
  origin?: string | null
  altitude_m?: number | null
  varietal?: string | null
  process?: string | null
  roast_level?: string | null
  roast_date?: string | null
  harvest_year?: number | null
  recommended_ratio?: string | null
  tasting_notes?: string[] | null
  extraction_profile?: ExtractionPoint[] | null
}

const EMPTY: CoffeeProfile = {
  origin: "",
  altitude_m: null,
  varietal: "",
  process: "",
  roast_level: "",
  roast_date: null,
  harvest_year: null,
  recommended_ratio: "",
  tasting_notes: [],
  extraction_profile: [],
}

const ROAST_LEVELS = ["Light", "Medium-Light", "Medium", "Medium-Dark", "Dark"]
const PROCESSES = ["Washed", "Natural", "Honey", "Anaerobic", "Other"]

async function adminFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`HTTP ${res.status}: ${text}`)
  }
  return (await res.json()) as T
}

const CoffeeProfileWidget = ({ data: product }: DetailWidgetProps<AdminProduct>) => {
  const productId = product.id
  const [profile, setProfile] = useState<CoffeeProfile>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    adminFetch<{ coffee_profile: CoffeeProfile | null }>(
      `/admin/products/${productId}/coffee-profile`
    )
      .then((r) => {
        if (cancelled) return
        setProfile({ ...EMPTY, ...(r.coffee_profile ?? {}) })
      })
      .catch((e) => toast.error("Failed to load coffee profile", { description: e.message }))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [productId])

  function update<K extends keyof CoffeeProfile>(key: K, value: CoffeeProfile[K]) {
    setProfile((p) => ({ ...p, [key]: value }))
  }

  function updateNotes(raw: string) {
    const notes = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    update("tasting_notes", notes)
  }

  function updateExtractionPoint(index: number, key: keyof ExtractionPoint, value: number) {
    setProfile((p) => {
      const next = [...(p.extraction_profile ?? [])]
      next[index] = { ...next[index], [key]: value }
      return { ...p, extraction_profile: next }
    })
  }

  function addPoint() {
    setProfile((p) => ({
      ...p,
      extraction_profile: [
        ...(p.extraction_profile ?? []),
        { time_s: 0, yield_g: 0 },
      ],
    }))
  }

  function removePoint(index: number) {
    setProfile((p) => ({
      ...p,
      extraction_profile: (p.extraction_profile ?? []).filter((_, i) => i !== index),
    }))
  }

  async function save() {
    setSaving(true)
    try {
      const body = {
        origin: profile.origin || null,
        altitude_m: profile.altitude_m || null,
        varietal: profile.varietal || null,
        process: profile.process || null,
        roast_level: profile.roast_level || null,
        roast_date: profile.roast_date
          ? new Date(profile.roast_date).toISOString()
          : null,
        harvest_year: profile.harvest_year || null,
        recommended_ratio: profile.recommended_ratio || null,
        tasting_notes: profile.tasting_notes ?? [],
        extraction_profile: (profile.extraction_profile ?? []).filter(
          (p) => p.time_s !== null && p.yield_g !== null
        ),
      }
      await adminFetch(`/admin/products/${productId}/coffee-profile`, {
        method: "POST",
        body: JSON.stringify(body),
      })
      toast.success("Coffee profile saved")
    } catch (e: any) {
      toast.error("Save failed", { description: e.message })
    } finally {
      setSaving(false)
    }
  }

  async function destroy() {
    if (!confirm("Delete this coffee profile?")) return
    setSaving(true)
    try {
      await adminFetch(`/admin/products/${productId}/coffee-profile`, {
        method: "DELETE",
      })
      setProfile(EMPTY)
      toast.success("Coffee profile deleted")
    } catch (e: any) {
      toast.error("Delete failed", { description: e.message })
    } finally {
      setSaving(false)
    }
  }

  const points = profile.extraction_profile ?? []

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Coffee Profile</Heading>
        <div className="flex gap-2">
          <Button variant="secondary" size="small" onClick={destroy} disabled={saving || loading}>
            Delete
          </Button>
          <Button size="small" onClick={save} disabled={saving || loading} isLoading={saving}>
            Save
          </Button>
        </div>
      </div>

      {loading ? (
        <Text className="px-6 py-6 text-ui-fg-muted">Loading…</Text>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 px-6 py-4 md:grid-cols-2">
            <Field label="Origin">
              <Input
                value={profile.origin ?? ""}
                onChange={(e) => update("origin", e.target.value)}
                placeholder="Western Ghats, Karnataka"
              />
            </Field>
            <Field label="Altitude (m)">
              <Input
                type="number"
                value={profile.altitude_m ?? ""}
                onChange={(e) =>
                  update(
                    "altitude_m",
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
                placeholder="1200"
              />
            </Field>
            <Field label="Varietal">
              <Input
                value={profile.varietal ?? ""}
                onChange={(e) => update("varietal", e.target.value)}
                placeholder="S795, Catimor"
              />
            </Field>
            <Field label="Process">
              <Select
                value={profile.process ?? ""}
                onValueChange={(v) => update("process", v || null)}
              >
                <Select.Trigger>
                  <Select.Value placeholder="Select process" />
                </Select.Trigger>
                <Select.Content>
                  {PROCESSES.map((p) => (
                    <Select.Item key={p} value={p}>
                      {p}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </Field>
            <Field label="Roast level">
              <Select
                value={profile.roast_level ?? ""}
                onValueChange={(v) => update("roast_level", v || null)}
              >
                <Select.Trigger>
                  <Select.Value placeholder="Select roast" />
                </Select.Trigger>
                <Select.Content>
                  {ROAST_LEVELS.map((r) => (
                    <Select.Item key={r} value={r}>
                      {r}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </Field>
            <Field label="Roast date">
              <Input
                type="date"
                value={
                  profile.roast_date
                    ? profile.roast_date.slice(0, 10)
                    : ""
                }
                onChange={(e) =>
                  update("roast_date", e.target.value || null)
                }
              />
            </Field>
            <Field label="Harvest year">
              <Input
                type="number"
                value={profile.harvest_year ?? ""}
                onChange={(e) =>
                  update(
                    "harvest_year",
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
                placeholder="2025"
              />
            </Field>
            <Field label="Recommended ratio">
              <Input
                value={profile.recommended_ratio ?? ""}
                onChange={(e) => update("recommended_ratio", e.target.value)}
                placeholder="1:16"
              />
            </Field>
            <Field label="Tasting notes (comma-separated)" colSpan>
              <Textarea
                value={(profile.tasting_notes ?? []).join(", ")}
                onChange={(e) => updateNotes(e.target.value)}
                placeholder="Dark chocolate, jaggery, stone fruit"
                rows={2}
              />
            </Field>
          </div>

          <div className="px-6 py-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <Label>Extraction profile</Label>
                <Text size="small" className="text-ui-fg-muted">
                  Time (sec) → yield (g) samples. Shown as a line chart on the storefront.
                </Text>
              </div>
              <Button variant="secondary" size="small" onClick={addPoint}>
                Add point
              </Button>
            </div>

            {points.length === 0 ? (
              <Text size="small" className="text-ui-fg-muted">
                No samples yet.
              </Text>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="text-ui-fg-muted">
                  <tr>
                    <th className="py-1 pr-3">Time (s)</th>
                    <th className="py-1 pr-3">Yield (g)</th>
                    <th className="py-1 pr-3">TDS %</th>
                    <th className="py-1" />
                  </tr>
                </thead>
                <tbody>
                  {points.map((p, i) => (
                    <tr key={i} className="border-t border-ui-border-base">
                      <td className="py-2 pr-3">
                        <Input
                          type="number"
                          value={p.time_s ?? 0}
                          onChange={(e) =>
                            updateExtractionPoint(i, "time_s", Number(e.target.value))
                          }
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <Input
                          type="number"
                          step="0.1"
                          value={p.yield_g ?? 0}
                          onChange={(e) =>
                            updateExtractionPoint(i, "yield_g", Number(e.target.value))
                          }
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <Input
                          type="number"
                          step="0.01"
                          value={p.tds ?? ""}
                          onChange={(e) =>
                            updateExtractionPoint(
                              i,
                              "tds",
                              e.target.value === "" ? (null as any) : Number(e.target.value)
                            )
                          }
                        />
                      </td>
                      <td className="py-2 text-right">
                        <Button
                          variant="transparent"
                          size="small"
                          onClick={() => removePoint(i)}
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </Container>
  )
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

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default CoffeeProfileWidget

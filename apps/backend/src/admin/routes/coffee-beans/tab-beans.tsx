import {
  Badge,
  Button,
  Checkbox,
  DropdownMenu,
  FocusModal,
  Heading,
  IconButton,
  Input,
  Label,
  Select,
  Table,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useEffect, useMemo, useState } from "react"
import { adminFetch, COFFEE_BEANS_HANDLE, Field } from "./lib"
import type { TabKey } from "./page"

type ProductTag = { id: string; value: string }
type ProductCategory = { id: string; name: string; handle: string }
type AdminProduct = {
  id: string
  title: string
  subtitle?: string | null
  handle?: string | null
  status?: string
  thumbnail?: string | null
  tags?: ProductTag[]
}

type BrewMethod = {
  id: string
  slug: string
  name: string
  method_label?: string | null
}

type BrewRecipe = {
  id: string
  product_id: string
  title?: string | null
  summary?: string | null
  brew_method: BrewMethod | null
}

type LabelKind = "single" | "multi" | "text" | "number"
type LabelCategory = {
  id: string
  name: string
  kind: LabelKind
  values: string[]
}

type CustomLabelValue = string | number | string[] | null
type CustomLabelMap = Record<string, CustomLabelValue>

type CoffeeProfile = {
  id?: string
  product_id?: string
  origin?: string | null
  altitude_m?: number | null
  varietal?: string | null
  process?: string | null
  roast_level?: string | null
  harvest_year?: number | null
  recommended_ratio?: string | null
  tasting_notes?: string[] | null
  custom_labels?: CustomLabelMap | null
}

// IDs that map onto the fixed columns of the coffee_profile model.
const BUILTIN_CATEGORY_IDS = new Set([
  "roast-levels",
  "processes",
  "tasting-notes",
])

type BeanRow = {
  product: AdminProduct
  profile: CoffeeProfile | null
}

export const BeansTab = ({
  onSwitchTab,
}: {
  onSwitchTab: (tab: TabKey) => void
}) => {
  const [category, setCategory] = useState<ProductCategory | null>(null)
  const [rows, setRows] = useState<BeanRow[]>([])
  const [tags, setTags] = useState<ProductTag[]>([])
  const [categories, setCategories] = useState<LabelCategory[]>([])
  const [brewMethods, setBrewMethods] = useState<BrewMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [bootstrapping, setBootstrapping] = useState(false)

  // Three independent modals.
  const [profileModalRow, setProfileModalRow] = useState<BeanRow | null>(null)
  const [tagsModalRow, setTagsModalRow] = useState<BeanRow | null>(null)
  const [brewsModalRow, setBrewsModalRow] = useState<BeanRow | null>(null)

  async function loadCategory(): Promise<ProductCategory | null> {
    const res = await adminFetch<{ product_categories: ProductCategory[] }>(
      `/admin/product-categories?handle=${COFFEE_BEANS_HANDLE}&fields=id,name,handle`
    )
    return res.product_categories?.[0] ?? null
  }

  async function loadProducts(categoryId: string): Promise<BeanRow[]> {
    const productRes = await adminFetch<{ products: AdminProduct[] }>(
      `/admin/products?category_id[]=${categoryId}&limit=200&fields=id,title,subtitle,handle,status,thumbnail,*tags`
    )
    const products = productRes.products ?? []
    const profiles = await Promise.all(
      products.map((p) =>
        adminFetch<{ coffee_profile: CoffeeProfile | null }>(
          `/admin/products/${p.id}/coffee-profile`
        )
          .then((r) => r.coffee_profile)
          .catch(() => null)
      )
    )
    return products.map((p, i) => ({ product: p, profile: profiles[i] }))
  }

  async function load(quiet = false) {
    if (!quiet) setLoading(true)
    try {
      const [cat, tagRes, settings, methodsRes] = await Promise.all([
        loadCategory(),
        adminFetch<{ product_tags: ProductTag[] }>(
          "/admin/product-tags?limit=500"
        ),
        adminFetch<{
          coffee_bean_settings: {
            label_categories: LabelCategory[] | null
          }
        }>("/admin/coffee-bean-settings").catch(() => ({
          coffee_bean_settings: {
            label_categories: [] as LabelCategory[] | null,
          },
        })),
        adminFetch<{ brew_methods: BrewMethod[] }>(
          "/admin/brew-methods"
        ).catch(() => ({ brew_methods: [] as BrewMethod[] })),
      ])
      setCategory(cat)
      setTags(tagRes.product_tags ?? [])
      setCategories(settings.coffee_bean_settings.label_categories ?? [])
      setBrewMethods(methodsRes.brew_methods ?? [])
      if (cat) setRows(await loadProducts(cat.id))
      else setRows([])
    } catch (e) {
      toast.error("Failed to load coffee beans", {
        description: (e as Error).message,
      })
    } finally {
      if (!quiet) setLoading(false)
    }
  }

  // Update one row's profile in-place after a successful save, then quietly
  // refresh in the background to pick up any server-side normalization.
  function applyProfile(productId: string, profile: CoffeeProfile) {
    setRows((prev) =>
      prev.map((r) => (r.product.id === productId ? { ...r, profile } : r))
    )
    load(true)
  }

  function applyProductTags(productId: string, tags: ProductTag[]) {
    setRows((prev) =>
      prev.map((r) =>
        r.product.id === productId
          ? { ...r, product: { ...r.product, tags } }
          : r
      )
    )
    load(true)
  }

  useEffect(() => {
    load()
  }, [])

  async function bootstrapCategory() {
    setBootstrapping(true)
    try {
      const res = await adminFetch<{ product_category: ProductCategory }>(
        "/admin/product-categories",
        {
          method: "POST",
          body: JSON.stringify({
            name: "Coffee Beans",
            handle: COFFEE_BEANS_HANDLE,
            is_active: true,
            is_internal: false,
          }),
        }
      )
      setCategory(res.product_category)
      toast.success(`Created "Coffee Beans" category`)
      load()
    } catch (e) {
      toast.error("Failed to create category", {
        description: (e as Error).message,
      })
    } finally {
      setBootstrapping(false)
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-ui-border-base px-6 py-4">
        <div>
          <Heading level="h2">Coffee beans</Heading>
          <Text size="small" className="text-ui-fg-muted">
            All products in the <code>coffee-beans</code> category. Create or
            delete beans in the standard Products page; manage their roast
            profile, tags and brew recipes here.
          </Text>
        </div>
      </div>

      {loading ? (
        <Text className="px-6 py-6 text-ui-fg-muted">Loading…</Text>
      ) : !category ? (
        <div className="px-6 py-12 text-center">
          <Text className="mb-3 text-ui-fg-muted">
            No <span className="font-medium">Coffee Beans</span> category
            exists yet.
          </Text>
          <Button
            onClick={bootstrapCategory}
            disabled={bootstrapping}
            isLoading={bootstrapping}
          >
            Create "Coffee Beans" category
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <Text className="text-ui-fg-muted">
            No coffee beans yet. Add one from the standard Products page and
            assign it to the <code>coffee-beans</code> category.
          </Text>
        </div>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Title</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Roast</Table.HeaderCell>
              <Table.HeaderCell>Origin</Table.HeaderCell>
              <Table.HeaderCell>Tags</Table.HeaderCell>
              <Table.HeaderCell className="text-right">
                Actions
              </Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rows.map((row) => (
              <Table.Row key={row.product.id}>
                <Table.Cell>
                  <div className="font-medium">{row.product.title}</div>
                  {row.product.subtitle && (
                    <Text size="small" className="text-ui-fg-muted">
                      {row.product.subtitle}
                    </Text>
                  )}
                </Table.Cell>
                <Table.Cell>
                  <Badge
                    size="2xsmall"
                    color={
                      row.product.status === "published" ? "green" : "grey"
                    }
                  >
                    {row.product.status ?? "draft"}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <Text size="small">{row.profile?.roast_level ?? "—"}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="small">{row.profile?.origin ?? "—"}</Text>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex flex-wrap gap-1">
                    {(row.product.tags ?? []).length === 0 ? (
                      <Text size="small" className="text-ui-fg-muted">
                        —
                      </Text>
                    ) : (
                      (row.product.tags ?? []).slice(0, 3).map((t) => (
                        <Badge key={t.id} size="2xsmall">
                          {t.value}
                        </Badge>
                      ))
                    )}
                  </div>
                </Table.Cell>
                <Table.Cell className="text-right">
                  <DropdownMenu>
                    <DropdownMenu.Trigger asChild>
                      <IconButton variant="transparent" aria-label="Edit options">
                        ⋯
                      </IconButton>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content align="end">
                      <DropdownMenu.Item
                        onClick={() => setProfileModalRow(row)}
                      >
                        Edit coffee profile
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        onClick={() => setTagsModalRow(row)}
                      >
                        Edit tags
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        onClick={() => setBrewsModalRow(row)}
                      >
                        Edit brew recipes
                      </DropdownMenu.Item>
                      <DropdownMenu.Separator />
                      <DropdownMenu.Item
                        onClick={() =>
                          window.open(
                            `/app/products/${row.product.id}`,
                            "_blank"
                          )
                        }
                      >
                        Open in product editor
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}

      {profileModalRow && (
        <ProfileModal
          row={profileModalRow}
          onClose={() => setProfileModalRow(null)}
          onSaved={(savedProfile) => {
            applyProfile(profileModalRow.product.id, savedProfile)
            setProfileModalRow(null)
          }}
          categories={categories}
          onSwitchTab={onSwitchTab}
        />
      )}

      {tagsModalRow && (
        <TagsModal
          row={tagsModalRow}
          tags={tags}
          onClose={() => setTagsModalRow(null)}
          onSaved={(updatedTags) => {
            applyProductTags(tagsModalRow.product.id, updatedTags)
            setTagsModalRow(null)
          }}
          onSwitchTab={onSwitchTab}
        />
      )}

      {brewsModalRow && (
        <BrewsModal
          row={brewsModalRow}
          brewMethods={brewMethods}
          onClose={() => setBrewsModalRow(null)}
          onSaved={() => {
            setBrewsModalRow(null)
            load(true)
          }}
          onSwitchTab={onSwitchTab}
        />
      )}
    </div>
  )
}

// ===========================================================================
// Profile modal
// ===========================================================================

type ProfileForm = {
  origin: string
  altitude_m: string
  varietal: string
  process: string
  roast_level: string
  harvest_year: string
  recommended_ratio: string
  tasting_notes: string[]
  // Per-custom-category values. String for single/text, number for number
  // (stored as string while typing), string[] for multi.
  custom_labels: Record<string, string | string[]>
}

const ProfileModal = ({
  row,
  onClose,
  onSaved,
  categories,
  onSwitchTab,
}: {
  row: BeanRow
  onClose: () => void
  onSaved: (profile: CoffeeProfile) => void
  categories: LabelCategory[]
  onSwitchTab: (tab: TabKey) => void
}) => {
  const roastLevels = useMemo(
    () => categories.find((c) => c.id === "roast-levels")?.values ?? [],
    [categories]
  )
  const processes = useMemo(
    () => categories.find((c) => c.id === "processes")?.values ?? [],
    [categories]
  )
  const labels = useMemo(
    () => categories.find((c) => c.id === "tasting-notes")?.values ?? [],
    [categories]
  )
  const customCategories = useMemo(
    () => categories.filter((c) => !BUILTIN_CATEGORY_IDS.has(c.id)),
    [categories]
  )

  const [form, setForm] = useState<ProfileForm>(() => {
    const existing = (row.profile?.custom_labels ?? {}) as CustomLabelMap
    const custom: Record<string, string | string[]> = {}
    for (const cat of categories) {
      if (BUILTIN_CATEGORY_IDS.has(cat.id)) continue
      const raw = existing[cat.id]
      if (cat.kind === "multi") {
        custom[cat.id] = Array.isArray(raw) ? (raw as string[]) : []
      } else if (cat.kind === "number") {
        custom[cat.id] = raw == null ? "" : String(raw)
      } else {
        custom[cat.id] = typeof raw === "string" ? raw : raw == null ? "" : ""
      }
    }
    return {
      origin: row.profile?.origin ?? "",
      altitude_m:
        row.profile?.altitude_m != null ? String(row.profile.altitude_m) : "",
      varietal: row.profile?.varietal ?? "",
      process: row.profile?.process ?? "",
      roast_level: row.profile?.roast_level ?? "",
      harvest_year:
        row.profile?.harvest_year != null
          ? String(row.profile.harvest_year)
          : "",
      recommended_ratio: row.profile?.recommended_ratio ?? "",
      tasting_notes: row.profile?.tasting_notes ?? [],
      custom_labels: custom,
    }
  })
  const [saving, setSaving] = useState(false)
  const [noteDraft, setNoteDraft] = useState("")

  function update<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setForm((p) => ({ ...p, [key]: value }))
  }

  function updateCustom(catId: string, value: string | string[]) {
    setForm((p) => ({
      ...p,
      custom_labels: { ...p.custom_labels, [catId]: value },
    }))
  }

  function toggleNote(value: string) {
    const idx = form.tasting_notes.findIndex(
      (n) => n.toLowerCase() === value.toLowerCase()
    )
    if (idx >= 0) {
      update(
        "tasting_notes",
        form.tasting_notes.filter((_, i) => i !== idx)
      )
    } else {
      update("tasting_notes", [...form.tasting_notes, value])
    }
  }

  function removeNote(idx: number) {
    update(
      "tasting_notes",
      form.tasting_notes.filter((_, i) => i !== idx)
    )
  }

  function addCustomNote() {
    const trimmed = noteDraft.trim()
    if (!trimmed) return
    if (
      form.tasting_notes.some(
        (n) => n.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      toast.error(`"${trimmed}" already added`)
      return
    }
    update("tasting_notes", [...form.tasting_notes, trimmed])
    setNoteDraft("")
  }

  async function save() {
    setSaving(true)
    try {
      // Serialize custom-label values per category kind.
      const customOut: CustomLabelMap = {}
      for (const cat of customCategories) {
        const raw = form.custom_labels[cat.id]
        if (cat.kind === "multi") {
          const arr = Array.isArray(raw) ? raw : []
          customOut[cat.id] = arr
        } else if (cat.kind === "number") {
          const s = typeof raw === "string" ? raw.trim() : ""
          customOut[cat.id] = s === "" ? null : Number(s)
        } else {
          const s = typeof raw === "string" ? raw.trim() : ""
          customOut[cat.id] = s === "" ? null : s
        }
      }
      const body = {
        origin: form.origin.trim() || null,
        altitude_m:
          form.altitude_m === "" ? null : Number(form.altitude_m),
        varietal: form.varietal.trim() || null,
        process: form.process || null,
        roast_level: form.roast_level || null,
        harvest_year:
          form.harvest_year === "" ? null : Number(form.harvest_year),
        recommended_ratio: form.recommended_ratio.trim() || null,
        tasting_notes: form.tasting_notes,
        custom_labels: customOut,
        extraction_profile: [],
      }
      const res = await adminFetch<{ coffee_profile: CoffeeProfile }>(
        `/admin/products/${row.product.id}/coffee-profile`,
        { method: "POST", body: JSON.stringify(body) }
      )
      toast.success("Coffee profile saved")
      onSaved(res.coffee_profile)
    } catch (e) {
      toast.error("Save failed", { description: (e as Error).message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <FocusModal open onOpenChange={(v) => !v && onClose()}>
      <FocusModal.Content>
        <FocusModal.Header>
          <div className="flex flex-1 items-center justify-between">
            <Heading level="h2">
              Coffee profile — {row.product.title}
            </Heading>
            <Button onClick={save} disabled={saving} isLoading={saving}>
              Save profile
            </Button>
          </div>
        </FocusModal.Header>
        <FocusModal.Body className="overflow-y-auto">
          <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
            <div className="rounded-md border border-ui-border-base bg-ui-bg-subtle px-4 py-3">
              <Text size="small">
                Roast level, process, and tasting-note labels come from the{" "}
                <button
                  type="button"
                  className="font-medium text-ui-fg-interactive underline"
                  onClick={() => {
                    onClose()
                    onSwitchTab("coffee-profile")
                  }}
                >
                  Coffee profile
                </button>{" "}
                tab. Add new options there if what you need is missing.
              </Text>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Origin">
                <Input
                  value={form.origin}
                  onChange={(e) => update("origin", e.target.value)}
                  placeholder="Sumatra & Ethiopia"
                />
              </Field>
              <Field label="Altitude (m)">
                <Input
                  type="number"
                  value={form.altitude_m}
                  onChange={(e) => update("altitude_m", e.target.value)}
                  placeholder="1800"
                />
              </Field>
              <Field label="Roast level">
                <Select
                  value={form.roast_level}
                  onValueChange={(v) => update("roast_level", v || "")}
                >
                  <Select.Trigger>
                    <Select.Value placeholder="Select roast" />
                  </Select.Trigger>
                  <Select.Content>
                    {roastLevels.map((r) => (
                      <Select.Item key={r} value={r}>
                        {r}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </Field>
              <Field label="Process">
                <Select
                  value={form.process}
                  onValueChange={(v) => update("process", v || "")}
                >
                  <Select.Trigger>
                    <Select.Value placeholder="Select process" />
                  </Select.Trigger>
                  <Select.Content>
                    {processes.map((p) => (
                      <Select.Item key={p} value={p}>
                        {p}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </Field>
              <Field label="Varietal">
                <Input
                  value={form.varietal}
                  onChange={(e) => update("varietal", e.target.value)}
                  placeholder="S795, Catimor"
                />
              </Field>
              <Field label="Harvest year">
                <Input
                  type="number"
                  value={form.harvest_year}
                  onChange={(e) => update("harvest_year", e.target.value)}
                  placeholder="2025"
                />
              </Field>
              <Field label="Recommended ratio">
                <Input
                  value={form.recommended_ratio}
                  onChange={(e) =>
                    update("recommended_ratio", e.target.value)
                  }
                  placeholder="1:16"
                />
              </Field>
            </div>

            {/* Tasting notes */}
            <div>
              <Label>Tasting notes</Label>
              <Text size="small" className="text-ui-fg-muted">
                Click a library label to add it, or type a custom note.
              </Text>

              {form.tasting_notes.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {form.tasting_notes.map((n, i) => (
                    <span
                      key={`${n}-${i}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-ui-border-base bg-ui-bg-subtle px-2.5 py-1 text-xs font-medium"
                    >
                      {n}
                      <button
                        type="button"
                        aria-label={`Remove ${n}`}
                        onClick={() => removeNote(i)}
                        className="text-ui-fg-muted hover:text-ui-fg-error"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {labels.length > 0 && (
                <div className="mt-3">
                  <Text size="xsmall" className="text-ui-fg-muted">
                    From library:
                  </Text>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {labels.map((l) => {
                      const selected = form.tasting_notes.some(
                        (n) => n.toLowerCase() === l.toLowerCase()
                      )
                      return (
                        <button
                          key={l}
                          type="button"
                          onClick={() => toggleNote(l)}
                          className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                            selected
                              ? "border-ui-fg-base bg-ui-fg-base text-ui-fg-on-color"
                              : "border-ui-border-base bg-ui-bg-base text-ui-fg-base hover:bg-ui-bg-base-hover"
                          }`}
                        >
                          {l}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="mt-3 flex gap-2">
                <Input
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addCustomNote()
                    }
                  }}
                  placeholder="Custom note (e.g. Stone fruit)"
                />
                <Button
                  variant="secondary"
                  onClick={addCustomNote}
                  disabled={!noteDraft.trim()}
                  type="button"
                >
                  Add
                </Button>
              </div>
            </div>

            {customCategories.length > 0 && (
              <div className="flex flex-col gap-5 border-t border-ui-border-base pt-6">
                <div>
                  <Label className="text-base font-semibold">
                    Custom labels
                  </Label>
                  <Text size="small" className="text-ui-fg-muted">
                    Defined under the Coffee profile tab. Edit the schema there
                    to add or remove categories.
                  </Text>
                </div>
                {customCategories.map((cat) => (
                  <CustomCategoryField
                    key={cat.id}
                    category={cat}
                    value={form.custom_labels[cat.id]}
                    onChange={(v) => updateCustom(cat.id, v)}
                  />
                ))}
              </div>
            )}
          </div>
        </FocusModal.Body>
      </FocusModal.Content>
    </FocusModal>
  )
}

// Renders an admin-defined custom label category as the right input for its
// kind (single / multi / text / number).
const CustomCategoryField = ({
  category,
  value,
  onChange,
}: {
  category: LabelCategory
  value: string | string[] | undefined
  onChange: (v: string | string[]) => void
}) => {
  if (category.kind === "single") {
    const v = typeof value === "string" ? value : ""
    return (
      <Field label={category.name}>
        <Select value={v} onValueChange={(next) => onChange(next || "")}>
          <Select.Trigger>
            <Select.Value placeholder={`Select ${category.name.toLowerCase()}`} />
          </Select.Trigger>
          <Select.Content>
            {category.values.map((opt) => (
              <Select.Item key={opt} value={opt}>
                {opt}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </Field>
    )
  }

  if (category.kind === "multi") {
    const arr = Array.isArray(value) ? value : []
    const toggle = (opt: string) => {
      const next = arr.includes(opt)
        ? arr.filter((x) => x !== opt)
        : [...arr, opt]
      onChange(next)
    }
    return (
      <Field label={category.name}>
        {arr.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {arr.map((n) => (
              <span
                key={n}
                className="inline-flex items-center gap-1.5 rounded-full border border-ui-border-base bg-ui-bg-subtle px-2.5 py-1 text-xs font-medium"
              >
                {n}
                <button
                  type="button"
                  aria-label={`Remove ${n}`}
                  onClick={() => onChange(arr.filter((x) => x !== n))}
                  className="text-ui-fg-muted hover:text-ui-fg-error"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        {category.values.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {category.values.map((opt) => {
              const selected = arr.includes(opt)
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggle(opt)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                    selected
                      ? "border-ui-fg-base bg-ui-fg-base text-ui-fg-on-color"
                      : "border-ui-border-base bg-ui-bg-base text-ui-fg-base hover:bg-ui-bg-base-hover"
                  }`}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        ) : (
          <Text size="xsmall" className="text-ui-fg-muted">
            No values defined for this category yet.
          </Text>
        )}
      </Field>
    )
  }

  if (category.kind === "number") {
    const v = typeof value === "string" ? value : ""
    return (
      <Field label={category.name}>
        <Input
          type="number"
          value={v}
          onChange={(e) => onChange(e.target.value)}
        />
      </Field>
    )
  }

  // text
  const v = typeof value === "string" ? value : ""
  return (
    <Field label={category.name}>
      <Input value={v} onChange={(e) => onChange(e.target.value)} />
    </Field>
  )
}

// ===========================================================================
// Tags modal
// ===========================================================================

const TagsModal = ({
  row,
  tags,
  onClose,
  onSaved,
  onSwitchTab,
}: {
  row: BeanRow
  tags: ProductTag[]
  onClose: () => void
  onSaved: (updatedTags: ProductTag[]) => void
  onSwitchTab: (tab: TabKey) => void
}) => {
  const [selected, setSelected] = useState<Set<string>>(
    new Set((row.product.tags ?? []).map((t) => t.id))
  )
  const [filter, setFilter] = useState("")
  const [saving, setSaving] = useState(false)

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return tags
    return tags.filter((t) => t.value.toLowerCase().includes(q))
  }, [tags, filter])

  function toggle(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  async function save() {
    setSaving(true)
    try {
      await adminFetch(`/admin/products/${row.product.id}`, {
        method: "POST",
        body: JSON.stringify({
          tags: Array.from(selected).map((id) => ({ id })),
        }),
      })
      // Build the new tag list from the local library so the row updates
      // immediately, regardless of what shape the product update response
      // returns.
      const updated = tags.filter((t) => selected.has(t.id))
      toast.success("Tags saved")
      onSaved(updated)
    } catch (e) {
      toast.error("Save failed", { description: (e as Error).message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <FocusModal open onOpenChange={(v) => !v && onClose()}>
      <FocusModal.Content>
        <FocusModal.Header>
          <div className="flex flex-1 items-center justify-between">
            <Heading level="h2">Tags — {row.product.title}</Heading>
            <Button onClick={save} disabled={saving} isLoading={saving}>
              Save tags
            </Button>
          </div>
        </FocusModal.Header>
        <FocusModal.Body className="overflow-y-auto">
          <div className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-8">
            <div className="rounded-md border border-ui-border-base bg-ui-bg-subtle px-4 py-3">
              <Text size="small">
                Manage the tag library and tagging categories under the{" "}
                <button
                  type="button"
                  className="font-medium text-ui-fg-interactive underline"
                  onClick={() => {
                    onClose()
                    onSwitchTab("tagging")
                  }}
                >
                  Tagging categories
                </button>{" "}
                tab.
              </Text>
            </div>

            {tags.length === 0 ? (
              <div className="rounded-md border border-dashed border-ui-border-base px-4 py-6 text-center">
                <Text size="small" className="text-ui-fg-muted">
                  No product tags exist yet.
                </Text>
              </div>
            ) : (
              <>
                <Input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter tags…"
                />
                <div className="max-h-[60vh] overflow-y-auto rounded-md border border-ui-border-base">
                  {visible.length === 0 ? (
                    <Text size="small" className="px-3 py-4 text-ui-fg-muted">
                      No tags match "{filter}".
                    </Text>
                  ) : (
                    <div className="grid grid-cols-1 gap-x-6 gap-y-1 p-2 sm:grid-cols-2">
                      {visible.map((t) => (
                        <label
                          key={t.id}
                          className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-ui-bg-base-hover"
                        >
                          <Checkbox
                            checked={selected.has(t.id)}
                            onCheckedChange={(v) => toggle(t.id, v === true)}
                          />
                          <span className="flex-1 truncate font-medium">
                            {t.value}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <Text size="xsmall" className="text-ui-fg-muted">
                  {selected.size} of {tags.length} selected
                </Text>
              </>
            )}
          </div>
        </FocusModal.Body>
      </FocusModal.Content>
    </FocusModal>
  )
}

// ===========================================================================
// Brew recipes modal
// ===========================================================================

const BrewsModal = ({
  row,
  brewMethods,
  onClose,
  onSaved,
  onSwitchTab,
}: {
  row: BeanRow
  brewMethods: BrewMethod[]
  onClose: () => void
  onSaved: () => void
  onSwitchTab: (tab: TabKey) => void
}) => {
  const [recipes, setRecipes] = useState<BrewRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [newMethodId, setNewMethodId] = useState("")
  const [newTitle, setNewTitle] = useState("")
  const [newSummary, setNewSummary] = useState("")
  const [creating, setCreating] = useState(false)
  const [edits, setEdits] = useState<
    Record<string, { title: string; summary: string }>
  >({})

  async function refresh() {
    setLoading(true)
    try {
      const r = await adminFetch<{ brew_recipes: BrewRecipe[] }>(
        `/admin/brew-recipes?product_id=${row.product.id}`
      )
      setRecipes(r.brew_recipes ?? [])
    } catch (e) {
      toast.error("Failed to load brew recipes", {
        description: (e as Error).message,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function createRecipe() {
    if (!newMethodId) {
      toast.error("Pick a brew method")
      return
    }
    setCreating(true)
    try {
      await adminFetch("/admin/brew-recipes", {
        method: "POST",
        body: JSON.stringify({
          product_id: row.product.id,
          brew_method_id: newMethodId,
          title: newTitle || null,
          summary: newSummary || null,
        }),
      })
      setNewMethodId("")
      setNewTitle("")
      setNewSummary("")
      toast.success("Recipe linked")
      refresh()
    } catch (e) {
      toast.error("Failed to link recipe", {
        description: (e as Error).message,
      })
    } finally {
      setCreating(false)
    }
  }

  async function commitEdit(id: string) {
    const patch = edits[id]
    if (!patch) return
    try {
      await adminFetch(`/admin/brew-recipes/${id}`, {
        method: "POST",
        body: JSON.stringify({
          title: patch.title || null,
          summary: patch.summary || null,
        }),
      })
      toast.success("Recipe updated")
      cancelEdit(id)
      refresh()
    } catch (e) {
      toast.error("Failed to update recipe", {
        description: (e as Error).message,
      })
    }
  }

  function startEdit(r: BrewRecipe) {
    setEdits({ ...edits, [r.id]: { title: r.title ?? "", summary: r.summary ?? "" } })
  }

  function cancelEdit(id: string) {
    const next = { ...edits }
    delete next[id]
    setEdits(next)
  }

  async function destroy(id: string) {
    if (!confirm("Remove this brew recipe from the bean?")) return
    try {
      await adminFetch(`/admin/brew-recipes/${id}`, { method: "DELETE" })
      toast.success("Recipe removed")
      refresh()
    } catch (e) {
      toast.error("Failed to remove recipe", {
        description: (e as Error).message,
      })
    }
  }

  return (
    <FocusModal open onOpenChange={(v) => !v && onClose()}>
      <FocusModal.Content>
        <FocusModal.Header>
          <div className="flex flex-1 items-center justify-between">
            <Heading level="h2">Brew recipes — {row.product.title}</Heading>
            <Button onClick={onSaved} variant="secondary">
              Done
            </Button>
          </div>
        </FocusModal.Header>
        <FocusModal.Body className="overflow-y-auto">
          <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
            <div className="rounded-md border border-ui-border-base bg-ui-bg-subtle px-4 py-3">
              <Text size="small">
                Manage brew methods (and their default params/steps) under the{" "}
                <button
                  type="button"
                  className="font-medium text-ui-fg-interactive underline"
                  onClick={() => {
                    onClose()
                    onSwitchTab("brew-labs")
                  }}
                >
                  Brew labs
                </button>{" "}
                tab.
              </Text>
            </div>

            {loading ? (
              <Text className="text-ui-fg-muted">Loading…</Text>
            ) : brewMethods.length === 0 ? (
              <div className="rounded-md border border-dashed border-ui-border-base px-4 py-6 text-center">
                <Text size="small" className="text-ui-fg-muted">
                  No brew methods exist. Create some under the Brew labs tab
                  first.
                </Text>
              </div>
            ) : (
              <>
                {/* Existing recipes */}
                {recipes.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {recipes.map((r) => {
                      const editing = edits[r.id]
                      return (
                        <div
                          key={r.id}
                          className="rounded-md border border-ui-border-base p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Badge size="2xsmall">
                                {r.brew_method?.name ?? "Method"}
                              </Badge>
                              {!editing && (
                                <span className="text-sm font-medium">
                                  {r.title || "(untitled recipe)"}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-1">
                              {editing ? (
                                <>
                                  <Button
                                    variant="secondary"
                                    size="small"
                                    onClick={() => commitEdit(r.id)}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    variant="transparent"
                                    size="small"
                                    onClick={() => cancelEdit(r.id)}
                                  >
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  variant="secondary"
                                  size="small"
                                  onClick={() => startEdit(r)}
                                >
                                  Edit
                                </Button>
                              )}
                              <Button
                                variant="transparent"
                                size="small"
                                className="text-ui-fg-error"
                                onClick={() => destroy(r.id)}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                          {editing ? (
                            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                              <Field label="Title">
                                <Input
                                  value={editing.title}
                                  onChange={(e) =>
                                    setEdits({
                                      ...edits,
                                      [r.id]: {
                                        ...editing,
                                        title: e.target.value,
                                      },
                                    })
                                  }
                                />
                              </Field>
                              <Field label="Summary" colSpan>
                                <Textarea
                                  rows={2}
                                  value={editing.summary}
                                  onChange={(e) =>
                                    setEdits({
                                      ...edits,
                                      [r.id]: {
                                        ...editing,
                                        summary: e.target.value,
                                      },
                                    })
                                  }
                                />
                              </Field>
                            </div>
                          ) : (
                            r.summary && (
                              <Text
                                size="small"
                                className="mt-1 text-ui-fg-muted"
                              >
                                {r.summary}
                              </Text>
                            )
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Add new */}
                <div className="rounded-md border border-dashed border-ui-border-base p-4">
                  <Text size="small" className="mb-3 text-ui-fg-muted">
                    Link a new brew method to this bean.
                  </Text>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Field label="Brew method *">
                      <Select
                        value={newMethodId}
                        onValueChange={(v) => setNewMethodId(v || "")}
                      >
                        <Select.Trigger>
                          <Select.Value placeholder="Pick a brew method" />
                        </Select.Trigger>
                        <Select.Content>
                          {brewMethods.map((m) => (
                            <Select.Item key={m.id} value={m.id}>
                              {m.name}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select>
                    </Field>
                    <Field label="Recipe title">
                      <Input
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Equator V60"
                      />
                    </Field>
                    <Field label="Summary" colSpan>
                      <Textarea
                        rows={2}
                        value={newSummary}
                        onChange={(e) => setNewSummary(e.target.value)}
                        placeholder="Bright, balanced cup with a medium grind."
                      />
                    </Field>
                  </div>
                  <Button
                    className="mt-3"
                    onClick={createRecipe}
                    disabled={!newMethodId || creating}
                    isLoading={creating}
                  >
                    Link recipe
                  </Button>
                </div>
              </>
            )}
          </div>
        </FocusModal.Body>
      </FocusModal.Content>
    </FocusModal>
  )
}

import {
  Badge,
  Button,
  Heading,
  Input,
  Label,
  Select,
  Text,
  toast,
} from "@medusajs/ui"
import { useEffect, useState } from "react"
import { adminFetch, slugify } from "./lib"

type LabelKind = "single" | "multi" | "text" | "number"

type LabelCategory = {
  id: string
  name: string
  kind: LabelKind
  values: string[]
}

// Well-known category ids the Beans modal wires its dropdowns to.
const KNOWN_IDS: { id: string; field: string }[] = [
  { id: "roast-levels", field: "roast_level dropdown" },
  { id: "processes", field: "process dropdown" },
  { id: "tasting-notes", field: "tasting-notes chip picker" },
]
const knownIdMap = new Map(KNOWN_IDS.map((k) => [k.id, k.field]))

const KIND_OPTIONS: { value: LabelKind; label: string; description: string }[] =
  [
    {
      value: "single",
      label: "Select one",
      description:
        "Dropdown — operator picks one of the listed values (e.g. Roast levels).",
    },
    {
      value: "multi",
      label: "Select many",
      description:
        "Chip picker — operator picks any number of values (e.g. Tasting notes).",
    },
    {
      value: "text",
      label: "Free text",
      description:
        "Single-line text input — no preset values needed (e.g. Varietal).",
    },
    {
      value: "number",
      label: "Number",
      description:
        "Numeric input — no preset values needed (e.g. Altitude).",
    },
  ]

const kindBadgeColor = (kind: LabelKind) => {
  switch (kind) {
    case "single":
      return "blue"
    case "multi":
      return "green"
    case "text":
      return "grey"
    case "number":
      return "orange"
  }
}

const kindLabel = (kind: LabelKind) =>
  KIND_OPTIONS.find((k) => k.value === kind)?.label ?? kind

export const CoffeeProfileTab = () => {
  const [categories, setCategories] = useState<LabelCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await adminFetch<{
        coffee_bean_settings: { label_categories: LabelCategory[] | null }
      }>("/admin/coffee-bean-settings")
      setCategories(res.coffee_bean_settings.label_categories ?? [])
    } catch (e) {
      toast.error("Failed to load coffee profile settings", {
        description: (e as Error).message,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function persist(next: LabelCategory[]) {
    setSaving(true)
    try {
      const res = await adminFetch<{
        coffee_bean_settings: { label_categories: LabelCategory[] | null }
      }>("/admin/coffee-bean-settings", {
        method: "POST",
        body: JSON.stringify({ label_categories: next }),
      })
      setCategories(res.coffee_bean_settings.label_categories ?? next)
    } catch (e) {
      toast.error("Save failed", { description: (e as Error).message })
      throw e
    } finally {
      setSaving(false)
    }
  }

  async function addCategory(input: { name: string; kind: LabelKind }) {
    const trimmed = input.name.trim()
    if (!trimmed) return
    const baseId = slugify(trimmed) || `category-${categories.length + 1}`
    let id = baseId
    let i = 2
    while (categories.some((c) => c.id === id)) {
      id = `${baseId}-${i++}`
    }
    try {
      await persist([
        ...categories,
        { id, name: trimmed, kind: input.kind, values: [] },
      ])
      toast.success(`Added "${trimmed}"`)
    } catch {
      /* toasted */
    }
  }

  async function removeCategory(id: string) {
    const cat = categories.find((c) => c.id === id)
    if (!cat) return
    const known = knownIdMap.get(id)
    const warning = known
      ? `Remove "${cat.name}"? This drives the ${known} in the Beans modal, which will go empty until you create a new category with id "${id}".`
      : `Remove "${cat.name}" and its values?`
    if (!confirm(warning)) return
    try {
      await persist(categories.filter((c) => c.id !== id))
      toast.success(`Removed "${cat.name}"`)
    } catch {
      /* toasted */
    }
  }

  async function renameCategory(id: string, name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    try {
      await persist(
        categories.map((c) => (c.id === id ? { ...c, name: trimmed } : c))
      )
      toast.success("Category renamed")
    } catch {
      /* toasted */
    }
  }

  async function addValue(id: string, value: string) {
    const trimmed = value.trim()
    if (!trimmed) return
    const cat = categories.find((c) => c.id === id)
    if (!cat) return
    if (
      cat.values.some((v) => v.toLowerCase() === trimmed.toLowerCase())
    ) {
      toast.error(`"${trimmed}" already exists`)
      return
    }
    try {
      await persist(
        categories.map((c) =>
          c.id === id ? { ...c, values: [...c.values, trimmed] } : c
        )
      )
      toast.success(`Added "${trimmed}"`)
    } catch {
      /* toasted */
    }
  }

  async function removeValue(id: string, value: string) {
    const cat = categories.find((c) => c.id === id)
    if (!cat) return
    if (
      !confirm(
        `Remove "${value}" from ${cat.name.toLowerCase()}? Existing data on beans is preserved.`
      )
    )
      return
    try {
      await persist(
        categories.map((c) =>
          c.id === id
            ? { ...c, values: c.values.filter((v) => v !== value) }
            : c
        )
      )
      toast.success(`Removed "${value}"`)
    } catch {
      /* toasted */
    }
  }

  return (
    <div className="flex flex-col">
      <div className="border-b border-ui-border-base px-6 py-4">
        <Heading level="h2">Coffee profile</Heading>
        <Text size="small" className="text-ui-fg-muted">
          Define the schema of label categories used by the Beans modal. Each
          category specifies its kind (select / multi / text / number) and,
          where applicable, its list of values.
        </Text>
      </div>

      <div className="flex flex-col gap-6 px-6 py-6">
        <AddCategory onAdd={addCategory} disabled={saving} />

        {loading ? (
          <Text className="text-ui-fg-muted">Loading…</Text>
        ) : categories.length === 0 ? (
          <div className="rounded-md border border-dashed border-ui-border-base px-4 py-12 text-center">
            <Text className="text-ui-fg-muted">
              No label categories yet. Add one above.
            </Text>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {categories.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                known={knownIdMap.get(cat.id)}
                saving={saving}
                onRename={(name) => renameCategory(cat.id, name)}
                onRemove={() => removeCategory(cat.id)}
                onAddValue={(v) => addValue(cat.id, v)}
                onRemoveValue={(v) => removeValue(cat.id, v)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const AddCategory = ({
  onAdd,
  disabled,
}: {
  onAdd: (input: { name: string; kind: LabelKind }) => Promise<void>
  disabled: boolean
}) => {
  const [name, setName] = useState("")
  const [kind, setKind] = useState<LabelKind>("multi")
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    if (!name.trim() || submitting) return
    setSubmitting(true)
    try {
      await onAdd({ name, kind })
      setName("")
      setKind("multi")
    } finally {
      setSubmitting(false)
    }
  }

  const description = KIND_OPTIONS.find((k) => k.value === kind)?.description

  return (
    <div className="rounded-md border border-dashed border-ui-border-base p-4">
      <Label className="mb-1 block">Add a new category</Label>
      <Text size="xsmall" className="mb-4 text-ui-fg-muted">
        Pick the schema — that's the kind of input the Beans modal will
        render for this category.
      </Text>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[2fr,1fr,auto]">
        <div>
          <Label size="xsmall" className="mb-1 block text-ui-fg-subtle">
            Name
          </Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                submit()
              }
            }}
            placeholder="e.g. Acidity"
            disabled={disabled || submitting}
          />
        </div>
        <div>
          <Label size="xsmall" className="mb-1 block text-ui-fg-subtle">
            Kind
          </Label>
          <Select
            value={kind}
            onValueChange={(v) => setKind((v as LabelKind) || "multi")}
          >
            <Select.Trigger>
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              {KIND_OPTIONS.map((k) => (
                <Select.Item key={k.value} value={k.value}>
                  {k.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
        <div className="flex items-end">
          <Button
            onClick={submit}
            disabled={disabled || submitting || !name.trim()}
            isLoading={submitting}
          >
            Add category
          </Button>
        </div>
      </div>
      {description && (
        <Text size="xsmall" className="mt-2 text-ui-fg-muted">
          {description}
        </Text>
      )}
    </div>
  )
}

const CategoryCard = ({
  category,
  known,
  saving,
  onRename,
  onRemove,
  onAddValue,
  onRemoveValue,
}: {
  category: LabelCategory
  known: string | undefined
  saving: boolean
  onRename: (name: string) => Promise<void>
  onRemove: () => Promise<void>
  onAddValue: (value: string) => Promise<void>
  onRemoveValue: (value: string) => Promise<void>
}) => {
  const [name, setName] = useState(category.name)
  const [valueDraft, setValueDraft] = useState("")

  useEffect(() => {
    setName(category.name)
  }, [category.name])

  const nameDirty = name.trim() !== category.name
  const needsValues =
    category.kind === "single" || category.kind === "multi"

  return (
    <section className="rounded-md border border-ui-border-base p-4">
      <div className="mb-3 flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[12rem]">
          <Label className="mb-1 block">Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Roast levels"
          />
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge size="2xsmall" color={kindBadgeColor(category.kind)}>
                {kindLabel(category.kind)}
              </Badge>
              <Text size="xsmall" className="text-ui-fg-muted">
                id: <code>{category.id}</code>
                {known && <> · drives the {known}</>}
              </Text>
            </div>
            {nameDirty && (
              <Button
                size="small"
                variant="secondary"
                disabled={saving}
                onClick={() => onRename(name)}
              >
                Save name
              </Button>
            )}
          </div>
        </div>
        <Button
          variant="transparent"
          className="text-ui-fg-error"
          onClick={onRemove}
          disabled={saving}
          type="button"
        >
          Remove category
        </Button>
      </div>

      {needsValues ? (
        <>
          <div className="flex gap-2">
            <Input
              value={valueDraft}
              onChange={(e) => setValueDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  if (valueDraft.trim()) {
                    onAddValue(valueDraft).then(() => setValueDraft(""))
                  }
                }
              }}
              placeholder="New value"
              disabled={saving}
            />
            <Button
              variant="secondary"
              onClick={() => {
                if (valueDraft.trim()) {
                  onAddValue(valueDraft).then(() => setValueDraft(""))
                }
              }}
              disabled={saving || !valueDraft.trim()}
            >
              Add value
            </Button>
          </div>

          {category.values.length === 0 ? (
            <Text size="xsmall" className="mt-3 text-ui-fg-muted">
              No values yet.
            </Text>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {category.values.map((v) => (
                <span
                  key={v}
                  className="inline-flex items-center gap-2 rounded-full border border-ui-border-base bg-ui-bg-subtle px-3 py-1.5 text-sm font-medium"
                >
                  {v}
                  <button
                    type="button"
                    onClick={() => onRemoveValue(v)}
                    aria-label={`Remove ${v}`}
                    disabled={saving}
                    className="text-ui-fg-muted hover:text-ui-fg-error disabled:opacity-50"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </>
      ) : (
        <Text size="xsmall" className="text-ui-fg-muted">
          {category.kind === "text"
            ? "Free-text input — no preset values needed."
            : "Numeric input — no preset values needed."}
        </Text>
      )}
    </section>
  )
}

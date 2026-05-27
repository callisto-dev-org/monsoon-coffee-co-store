import {
  Badge,
  Button,
  Checkbox,
  FocusModal,
  Heading,
  IconButton,
  Input,
  Label,
  Table,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useEffect, useState } from "react"
import { adminFetch, slugifyKey, Field } from "./lib"

type ParamSchemaItem = { key: string; label: string; unit?: string }
type StepItem = { name: string; description: string }

type BrewMethod = {
  id: string
  slug: string
  name: string
  method_label?: string | null
  summary?: string | null
  image_url?: string | null
  param_schema?: ParamSchemaItem[] | null
  steps?: StepItem[] | null
}

type FormState = Omit<BrewMethod, "id"> & { id?: string }

const EMPTY_FORM: FormState = {
  slug: "",
  name: "",
  method_label: "",
  summary: "",
  image_url: "",
  param_schema: [],
  steps: [],
}

export const BrewLabsTab = () => {
  const [methods, setMethods] = useState<BrewMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const isEdit = !!editing.id

  async function load() {
    setLoading(true)
    try {
      const r = await adminFetch<{ brew_methods: BrewMethod[] }>(
        "/admin/brew-methods"
      )
      setMethods(r.brew_methods ?? [])
    } catch (e) {
      toast.error("Failed to load brew methods", {
        description: (e as Error).message,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function startCreate() {
    setEditing(EMPTY_FORM)
    setModalOpen(true)
  }

  function startEdit(m: BrewMethod) {
    setEditing({
      id: m.id,
      slug: m.slug,
      name: m.name,
      method_label: m.method_label ?? "",
      summary: m.summary ?? "",
      image_url: m.image_url ?? "",
      param_schema: m.param_schema ?? [],
      steps: m.steps ?? [],
    })
    setModalOpen(true)
  }

  async function save() {
    if (!editing.slug || !editing.name) {
      toast.error("Slug and name are required")
      return
    }
    if (!/^[a-z0-9-]+$/.test(editing.slug)) {
      toast.error("Slug must be lowercase letters, digits and dashes only")
      return
    }
    setSaving(true)
    try {
      const body = {
        slug: editing.slug,
        name: editing.name,
        method_label: editing.method_label || null,
        summary: editing.summary || null,
        image_url: editing.image_url || null,
        param_schema: (editing.param_schema ?? []).filter(
          (p) => p.key && p.label
        ),
        steps: (editing.steps ?? []).filter((s) => s.name && s.description),
      }
      if (isEdit) {
        await adminFetch(`/admin/brew-methods/${editing.id}`, {
          method: "POST",
          body: JSON.stringify(body),
        })
        toast.success(`Updated "${editing.name}"`)
      } else {
        await adminFetch("/admin/brew-methods", {
          method: "POST",
          body: JSON.stringify(body),
        })
        toast.success(`Created "${editing.name}"`)
      }
      setModalOpen(false)
      load()
    } catch (e) {
      toast.error(isEdit ? "Update failed" : "Create failed", {
        description: (e as Error).message,
      })
    } finally {
      setSaving(false)
    }
  }

  async function destroy(m: BrewMethod) {
    if (!confirm(`Delete brew method "${m.name}"? This cannot be undone.`))
      return
    try {
      await adminFetch(`/admin/brew-methods/${m.id}`, { method: "DELETE" })
      toast.success(`Deleted "${m.name}"`)
      load()
    } catch (e) {
      toast.error("Delete failed", { description: (e as Error).message })
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-ui-border-base px-6 py-4">
        <div>
          <Heading level="h2">Brew methods</Heading>
          <Text size="small" className="text-ui-fg-muted">
            Extraction protocols shared across coffee products. Per-bean
            recipes are attached on each bean.
          </Text>
        </div>
        <Button onClick={startCreate}>Add brew method</Button>
      </div>

      {loading ? (
        <Text className="px-6 py-6 text-ui-fg-muted">Loading…</Text>
      ) : methods.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <Text className="text-ui-fg-muted">No brew methods yet.</Text>
          <Button className="mt-3" onClick={startCreate} variant="secondary">
            Add your first one
          </Button>
        </div>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>Slug</Table.HeaderCell>
              <Table.HeaderCell>Label</Table.HeaderCell>
              <Table.HeaderCell>Params</Table.HeaderCell>
              <Table.HeaderCell>Steps</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {methods.map((m) => (
              <Table.Row key={m.id} className="cursor-pointer">
                <Table.Cell onClick={() => startEdit(m)}>
                  <div className="font-medium">{m.name}</div>
                  {m.summary && (
                    <Text size="small" className="text-ui-fg-muted line-clamp-1">
                      {m.summary}
                    </Text>
                  )}
                </Table.Cell>
                <Table.Cell onClick={() => startEdit(m)}>
                  <code className="text-ui-fg-subtle">{m.slug}</code>
                </Table.Cell>
                <Table.Cell onClick={() => startEdit(m)}>
                  {m.method_label ? (
                    <Badge size="2xsmall">{m.method_label}</Badge>
                  ) : (
                    <Text size="small" className="text-ui-fg-muted">—</Text>
                  )}
                </Table.Cell>
                <Table.Cell onClick={() => startEdit(m)}>
                  {(m.param_schema?.length ?? 0)}
                </Table.Cell>
                <Table.Cell onClick={() => startEdit(m)}>
                  {(m.steps?.length ?? 0)}
                </Table.Cell>
                <Table.Cell className="text-right">
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => startEdit(m)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="transparent"
                    size="small"
                    className="ml-2 text-ui-fg-error"
                    onClick={() => destroy(m)}
                  >
                    Delete
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}

      <BrewMethodModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        state={editing}
        setState={setEditing}
        isEdit={isEdit}
        saving={saving}
        onSave={save}
      />

      <VisibilitySection />
    </div>
  )
}

type ProductCategory = { id: string; name: string; handle?: string }

const VisibilitySection = () => {
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [enabled, setEnabled] = useState<Set<string>>(new Set())
  const [original, setOriginal] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      adminFetch<{ product_categories: ProductCategory[] }>(
        "/admin/product-categories?limit=500&fields=id,name,handle"
      ),
      adminFetch<{
        brew_settings: { enabled_product_category_ids: string[] | null }
      }>("/admin/brew-settings"),
    ])
      .then(([catRes, settingsRes]) => {
        if (cancelled) return
        setCategories(catRes.product_categories ?? [])
        const ids = new Set(
          settingsRes.brew_settings?.enabled_product_category_ids ?? []
        )
        setEnabled(ids)
        setOriginal(new Set(ids))
      })
      .catch((e) =>
        toast.error("Failed to load visibility settings", {
          description: (e as Error).message,
        })
      )
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  const dirty =
    enabled.size !== original.size ||
    Array.from(enabled).some((id) => !original.has(id))

  function toggle(id: string, checked: boolean) {
    setEnabled((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  async function save() {
    setSaving(true)
    try {
      await adminFetch("/admin/brew-settings", {
        method: "POST",
        body: JSON.stringify({
          enabled_product_category_ids: Array.from(enabled),
        }),
      })
      setOriginal(new Set(enabled))
      toast.success("Visibility saved")
    } catch (e) {
      toast.error("Save failed", { description: (e as Error).message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border-t border-ui-border-base px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Heading level="h2">Linkable product categories</Heading>
          <Text size="small" className="text-ui-fg-muted">
            Products in the selected categories can have brew recipes
            attached. The brew recipes section will appear on those products
            in admin and on the storefront.
          </Text>
        </div>
        <Button onClick={save} disabled={!dirty || saving} isLoading={saving}>
          Save
        </Button>
      </div>

      {loading ? (
        <Text className="text-ui-fg-muted">Loading…</Text>
      ) : categories.length === 0 ? (
        <Text className="text-ui-fg-muted">
          No product categories found. Create one under Settings → Categories.
        </Text>
      ) : (
        <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <label
              key={c.id}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-ui-bg-base-hover"
            >
              <Checkbox
                checked={enabled.has(c.id)}
                onCheckedChange={(v) => toggle(c.id, v === true)}
              />
              <span className="flex-1 font-medium">{c.name}</span>
              {c.handle && (
                <code className="text-ui-fg-subtle text-xs">{c.handle}</code>
              )}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

const BrewMethodModal = ({
  open,
  onOpenChange,
  state,
  setState,
  isEdit,
  saving,
  onSave,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  state: FormState
  setState: (s: FormState) => void
  isEdit: boolean
  saving: boolean
  onSave: () => void
}) => {
  const params = state.param_schema ?? []
  const steps = state.steps ?? []

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState({ ...state, [key]: value })
  }

  function updateParam(i: number, patch: Partial<ParamSchemaItem>) {
    const next = [...params]
    next[i] = { ...next[i], ...patch }
    update("param_schema", next)
  }

  function updateParamLabel(i: number, label: string) {
    const current = params[i]
    const keyWasAuto =
      !current.key || current.key === slugifyKey(current.label || "")
    updateParam(i, {
      label,
      key: keyWasAuto ? slugifyKey(label) : current.key,
    })
  }

  function addParam() {
    update("param_schema", [...params, { key: "", label: "", unit: "" }])
  }

  function removeParam(i: number) {
    update("param_schema", params.filter((_, idx) => idx !== i))
  }

  function updateStep(i: number, patch: Partial<StepItem>) {
    const next = [...steps]
    next[i] = { ...next[i], ...patch }
    update("steps", next)
  }

  function addStep() {
    update("steps", [
      ...steps,
      {
        name: `Step ${String(steps.length + 1).padStart(2, "0")}`,
        description: "",
      },
    ])
  }

  function removeStep(i: number) {
    update("steps", steps.filter((_, idx) => idx !== i))
  }

  return (
    <FocusModal open={open} onOpenChange={onOpenChange}>
      <FocusModal.Content>
        <FocusModal.Header>
          <div className="flex flex-1 items-center justify-between">
            <Heading level="h2">
              {isEdit
                ? `Edit ${state.name || "brew method"}`
                : "New brew method"}
            </Heading>
            <Button onClick={onSave} disabled={saving} isLoading={saving}>
              {isEdit ? "Save changes" : "Create"}
            </Button>
          </div>
        </FocusModal.Header>
        <FocusModal.Body className="overflow-y-auto">
          <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-8">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Name *">
                <Input
                  value={state.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="V60"
                />
              </Field>
              <Field label="Slug *">
                <Input
                  value={state.slug}
                  onChange={(e) =>
                    update("slug", e.target.value.toLowerCase())
                  }
                  placeholder="v60"
                  disabled={isEdit}
                />
              </Field>
              <Field label="Method label">
                <Input
                  value={state.method_label ?? ""}
                  onChange={(e) => update("method_label", e.target.value)}
                  placeholder="POUR-OVER"
                />
              </Field>
              <Field label="Image URL">
                <Input
                  value={state.image_url ?? ""}
                  onChange={(e) => update("image_url", e.target.value)}
                  placeholder="https://…"
                />
              </Field>
              <Field label="Summary" colSpan>
                <Textarea
                  value={state.summary ?? ""}
                  onChange={(e) => update("summary", e.target.value)}
                  rows={2}
                  placeholder="Short description shown in product brew sections."
                />
              </Field>
            </div>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <Label>Param schema</Label>
                  <Text size="small" className="text-ui-fg-muted">
                    Fields the recipe form will collect per-bean.
                  </Text>
                </div>
                <Button variant="secondary" size="small" onClick={addParam}>
                  Add param
                </Button>
              </div>
              {params.length === 0 ? (
                <div className="rounded-md border border-dashed border-ui-border-base px-4 py-6 text-center">
                  <Text size="small" className="text-ui-fg-muted">
                    No params yet.
                  </Text>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {params.map((p, i) => (
                    <div
                      key={i}
                      className="rounded-md border border-ui-border-base bg-ui-bg-subtle p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <Text
                          size="small"
                          className="font-medium text-ui-fg-subtle"
                        >
                          Param {i + 1}
                        </Text>
                        <Button
                          variant="transparent"
                          size="small"
                          onClick={() => removeParam(i)}
                          className="text-ui-fg-error"
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                        <div className="sm:col-span-5">
                          <Label
                            size="xsmall"
                            className="mb-1 block text-ui-fg-subtle"
                          >
                            Label
                          </Label>
                          <Input
                            value={p.label}
                            onChange={(e) =>
                              updateParamLabel(i, e.target.value)
                            }
                            placeholder="Grain size"
                          />
                        </div>
                        <div className="sm:col-span-4">
                          <Label
                            size="xsmall"
                            className="mb-1 block text-ui-fg-subtle"
                          >
                            Key
                          </Label>
                          <Input
                            value={p.key}
                            onChange={(e) =>
                              updateParam(i, {
                                key: slugifyKey(e.target.value),
                              })
                            }
                            placeholder="grain_size"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <Label
                            size="xsmall"
                            className="mb-1 block text-ui-fg-subtle"
                          >
                            Unit
                          </Label>
                          <Input
                            value={p.unit ?? ""}
                            onChange={(e) =>
                              updateParam(i, { unit: e.target.value })
                            }
                            placeholder="°C, ml"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <Label>Default steps</Label>
                  <Text size="small" className="text-ui-fg-muted">
                    Shown on products unless a brew recipe overrides them.
                  </Text>
                </div>
                <Button variant="secondary" size="small" onClick={addStep}>
                  Add step
                </Button>
              </div>
              {steps.length === 0 ? (
                <Text size="small" className="text-ui-fg-muted">
                  No steps yet.
                </Text>
              ) : (
                <div className="flex flex-col gap-3">
                  {steps.map((s, i) => (
                    <div
                      key={i}
                      className="rounded-md border border-ui-border-base p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Input
                          value={s.name}
                          onChange={(e) =>
                            updateStep(i, { name: e.target.value })
                          }
                          placeholder="Step 01"
                          className="max-w-xs"
                        />
                        <IconButton
                          variant="transparent"
                          size="small"
                          onClick={() => removeStep(i)}
                          aria-label="Remove step"
                          className="text-ui-fg-error"
                        >
                          ✕
                        </IconButton>
                      </div>
                      <Textarea
                        className="mt-2"
                        rows={2}
                        value={s.description}
                        onChange={(e) =>
                          updateStep(i, { description: e.target.value })
                        }
                        placeholder="Medium-fine grind, 1:16 ratio."
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </FocusModal.Body>
      </FocusModal.Content>
    </FocusModal>
  )
}

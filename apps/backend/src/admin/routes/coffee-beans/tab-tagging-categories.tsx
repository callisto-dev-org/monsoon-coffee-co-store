import {
  Badge,
  Button,
  Checkbox,
  FocusModal,
  Heading,
  Input,
  Label,
  Table,
  Text,
  toast,
} from "@medusajs/ui"
import { useEffect, useMemo, useState } from "react"
import { adminFetch, slugify, Field } from "./lib"

type FilterCategory = {
  id: string
  name: string
  handle: string
  rank: number
  tag_ids?: string[] | null
}

type ProductTag = { id: string; value: string }

type FormState = {
  id?: string
  name: string
  handle: string
  rank: number
  tag_ids: string[]
}

const EMPTY_FORM: FormState = {
  name: "",
  handle: "",
  rank: 0,
  tag_ids: [],
}

export const TaggingCategoriesTab = () => {
  const [categories, setCategories] = useState<FilterCategory[]>([])
  const [tags, setTags] = useState<ProductTag[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const isEdit = !!editing.id

  const tagsById = useMemo(
    () => new Map(tags.map((t) => [t.id, t])),
    [tags]
  )

  async function load() {
    setLoading(true)
    try {
      const [cats, tagRes] = await Promise.all([
        adminFetch<{ filter_categories: FilterCategory[] }>(
          "/admin/filter-categories"
        ),
        adminFetch<{ product_tags: ProductTag[] }>(
          "/admin/product-tags?limit=500"
        ),
      ])
      setCategories(cats.filter_categories ?? [])
      setTags(tagRes.product_tags ?? [])
    } catch (e) {
      toast.error("Failed to load filter categories", {
        description: (e as Error).message,
      })
    } finally {
      setLoading(false)
    }
  }

  async function createTag(value: string): Promise<ProductTag | null> {
    const trimmed = value.trim()
    if (!trimmed) {
      toast.error("Tag value is required")
      return null
    }
    const exists = tags.find(
      (t) => t.value.toLowerCase() === trimmed.toLowerCase()
    )
    if (exists) {
      toast.error(`Tag "${trimmed}" already exists`)
      return exists
    }
    try {
      const res = await adminFetch<{ product_tag: ProductTag }>(
        "/admin/product-tags",
        { method: "POST", body: JSON.stringify({ value: trimmed }) }
      )
      const created = res.product_tag
      setTags((prev) => [...prev, created])
      toast.success(`Created tag "${created.value}"`)
      return created
    } catch (e) {
      toast.error("Failed to create tag", {
        description: (e as Error).message,
      })
      return null
    }
  }

  useEffect(() => {
    load()
  }, [])

  function startCreate() {
    setEditing({ ...EMPTY_FORM, rank: categories.length })
    setModalOpen(true)
  }

  function startEdit(c: FilterCategory) {
    setEditing({
      id: c.id,
      name: c.name,
      handle: c.handle,
      rank: c.rank ?? 0,
      tag_ids: c.tag_ids ?? [],
    })
    setModalOpen(true)
  }

  async function save() {
    if (!editing.name.trim()) {
      toast.error("Name is required")
      return
    }
    if (!editing.handle || !/^[a-z0-9-]+$/.test(editing.handle)) {
      toast.error("Handle must be lowercase letters, digits and dashes only")
      return
    }
    setSaving(true)
    try {
      const body = {
        name: editing.name.trim(),
        handle: editing.handle,
        rank: editing.rank,
        tag_ids: editing.tag_ids,
      }
      if (isEdit) {
        await adminFetch(`/admin/filter-categories/${editing.id}`, {
          method: "POST",
          body: JSON.stringify(body),
        })
        toast.success(`Updated "${editing.name}"`)
      } else {
        await adminFetch("/admin/filter-categories", {
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

  async function destroy(c: FilterCategory) {
    if (
      !confirm(`Delete filter category "${c.name}"? This cannot be undone.`)
    )
      return
    try {
      await adminFetch(`/admin/filter-categories/${c.id}`, {
        method: "DELETE",
      })
      toast.success(`Deleted "${c.name}"`)
      load()
    } catch (e) {
      toast.error("Delete failed", { description: (e as Error).message })
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-ui-border-base px-6 py-4">
        <div>
          <Heading level="h2">Tagging categories</Heading>
          <Text size="small" className="text-ui-fg-muted">
            Group product tags into filter sections shown on the storefront
            (e.g. Origin → Ethiopia, Brazil; Roast Level → Light, Dark).
          </Text>
        </div>
        <Button onClick={startCreate}>Add category</Button>
      </div>

      {loading ? (
        <Text className="px-6 py-6 text-ui-fg-muted">Loading…</Text>
      ) : categories.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <Text className="text-ui-fg-muted">
            No filter categories yet. Create one to start grouping product
            tags into storefront filters.
          </Text>
          <Button className="mt-3" onClick={startCreate} variant="secondary">
            Add your first one
          </Button>
        </div>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>Handle</Table.HeaderCell>
              <Table.HeaderCell>Rank</Table.HeaderCell>
              <Table.HeaderCell>Tags</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {categories.map((c) => (
              <Table.Row key={c.id} className="cursor-pointer">
                <Table.Cell onClick={() => startEdit(c)}>
                  <div className="font-medium">{c.name}</div>
                </Table.Cell>
                <Table.Cell onClick={() => startEdit(c)}>
                  <code className="text-ui-fg-subtle">{c.handle}</code>
                </Table.Cell>
                <Table.Cell onClick={() => startEdit(c)}>
                  <Text size="small" className="text-ui-fg-muted">
                    {c.rank ?? 0}
                  </Text>
                </Table.Cell>
                <Table.Cell onClick={() => startEdit(c)}>
                  <div className="flex flex-wrap gap-1">
                    {(c.tag_ids ?? []).length === 0 ? (
                      <Text size="small" className="text-ui-fg-muted">
                        —
                      </Text>
                    ) : (
                      (c.tag_ids ?? []).map((id) => {
                        const t = tagsById.get(id)
                        return (
                          <Badge key={id} size="2xsmall">
                            {t ? t.value : `(missing) ${id.slice(-6)}`}
                          </Badge>
                        )
                      })
                    )}
                  </div>
                </Table.Cell>
                <Table.Cell className="text-right">
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => startEdit(c)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="transparent"
                    size="small"
                    className="ml-2 text-ui-fg-error"
                    onClick={() => destroy(c)}
                  >
                    Delete
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}

      <FilterCategoryModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        state={editing}
        setState={setEditing}
        tags={tags}
        isEdit={isEdit}
        saving={saving}
        onSave={save}
        onCreateTag={createTag}
      />
    </div>
  )
}

const FilterCategoryModal = ({
  open,
  onOpenChange,
  state,
  setState,
  tags,
  isEdit,
  saving,
  onSave,
  onCreateTag,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  state: FormState
  setState: (s: FormState) => void
  tags: ProductTag[]
  isEdit: boolean
  saving: boolean
  onSave: () => void
  onCreateTag: (value: string) => Promise<ProductTag | null>
}) => {
  const [tagFilter, setTagFilter] = useState("")
  const [newTagValue, setNewTagValue] = useState("")
  const [creatingTag, setCreatingTag] = useState(false)

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState({ ...state, [key]: value })
  }

  function updateName(name: string) {
    if (isEdit) {
      update("name", name)
    } else {
      const prevAuto = slugify(state.name)
      const handleWasAuto = !state.handle || state.handle === prevAuto
      setState({
        ...state,
        name,
        handle: handleWasAuto ? slugify(name) : state.handle,
      })
    }
  }

  function toggleTag(id: string, checked: boolean) {
    const set = new Set(state.tag_ids)
    if (checked) set.add(id)
    else set.delete(id)
    update("tag_ids", Array.from(set))
  }

  async function handleCreateTag() {
    if (!newTagValue.trim() || creatingTag) return
    setCreatingTag(true)
    try {
      const created = await onCreateTag(newTagValue)
      if (created) {
        const set = new Set(state.tag_ids)
        set.add(created.id)
        update("tag_ids", Array.from(set))
        setNewTagValue("")
      }
    } finally {
      setCreatingTag(false)
    }
  }

  const visibleTags = useMemo(() => {
    const q = tagFilter.trim().toLowerCase()
    if (!q) return tags
    return tags.filter((t) => t.value.toLowerCase().includes(q))
  }, [tags, tagFilter])

  return (
    <FocusModal open={open} onOpenChange={onOpenChange}>
      <FocusModal.Content>
        <FocusModal.Header>
          <div className="flex flex-1 items-center justify-between">
            <Heading level="h2">
              {isEdit
                ? `Edit ${state.name || "filter category"}`
                : "New filter category"}
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
                  onChange={(e) => updateName(e.target.value)}
                  placeholder="Origin"
                />
              </Field>
              <Field label="Handle *">
                <Input
                  value={state.handle}
                  onChange={(e) => update("handle", e.target.value.toLowerCase())}
                  placeholder="origin"
                  disabled={isEdit}
                />
                <Text size="xsmall" className="mt-1 text-ui-fg-muted">
                  URL-safe slug. Lowercase letters, digits and dashes only.
                </Text>
              </Field>
              <Field label="Rank">
                <Input
                  type="number"
                  value={String(state.rank ?? 0)}
                  onChange={(e) =>
                    update("rank", Number(e.target.value) || 0)
                  }
                  placeholder="0"
                />
                <Text size="xsmall" className="mt-1 text-ui-fg-muted">
                  Lower numbers appear first on the storefront.
                </Text>
              </Field>
            </div>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <Label>Tags</Label>
                  <Text size="small" className="text-ui-fg-muted">
                    Choose which product tags appear under this filter section,
                    or create a new tag below.
                  </Text>
                </div>
                <Text size="small" className="text-ui-fg-muted">
                  {state.tag_ids.length} of {tags.length} selected
                </Text>
              </div>

              <div className="mb-3 flex gap-2">
                <Input
                  value={newTagValue}
                  onChange={(e) => setNewTagValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleCreateTag()
                    }
                  }}
                  placeholder="New tag value (e.g. Ethiopia)"
                  disabled={creatingTag}
                />
                <Button
                  variant="secondary"
                  onClick={handleCreateTag}
                  disabled={creatingTag || !newTagValue.trim()}
                  isLoading={creatingTag}
                >
                  Create tag
                </Button>
              </div>

              {tags.length === 0 ? (
                <div className="rounded-md border border-dashed border-ui-border-base px-4 py-6 text-center">
                  <Text size="small" className="text-ui-fg-muted">
                    No product tags exist yet. Use the field above to create
                    your first one.
                  </Text>
                </div>
              ) : (
                <>
                  <Input
                    value={tagFilter}
                    onChange={(e) => setTagFilter(e.target.value)}
                    placeholder="Filter tags…"
                    className="mb-3"
                  />
                  <div className="max-h-80 overflow-y-auto rounded-md border border-ui-border-base">
                    {visibleTags.length === 0 ? (
                      <Text size="small" className="px-3 py-4 text-ui-fg-muted">
                        No tags match "{tagFilter}".
                      </Text>
                    ) : (
                      <div className="grid grid-cols-1 gap-x-6 gap-y-1 p-2 sm:grid-cols-2">
                        {visibleTags.map((t) => (
                          <label
                            key={t.id}
                            className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-ui-bg-base-hover"
                          >
                            <Checkbox
                              checked={state.tag_ids.includes(t.id)}
                              onCheckedChange={(v) =>
                                toggleTag(t.id, v === true)
                              }
                            />
                            <span className="flex-1 truncate font-medium">
                              {t.value}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </section>
          </div>
        </FocusModal.Body>
      </FocusModal.Content>
    </FocusModal>
  )
}

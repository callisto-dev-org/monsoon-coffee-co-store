import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Label,
  Select,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useEffect, useMemo, useState } from "react"

type ParamSchemaItem = { key: string; label: string; unit?: string }
type StepItem = { name: string; description: string }

type BrewMethod = {
  id: string
  slug: string
  name: string
  method_label?: string | null
  param_schema?: ParamSchemaItem[] | null
  steps?: StepItem[] | null
}

type BrewRecipe = {
  id: string
  product_id: string
  title?: string | null
  summary?: string | null
  params?: Record<string, unknown> | null
  steps?: StepItem[] | null
  brew_method?: BrewMethod | null
}

// Fallback used when /admin/brew-settings hasn't been configured yet so
// existing coffee products keep showing the widget out of the box.
const FALLBACK_PRODUCT_TYPE_VALUE = "coffee"

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`HTTP ${res.status}: ${body}`)
  }
  return (await res.json()) as T
}

const ProductBrewRecipesWidget = ({
  data: product,
}: DetailWidgetProps<AdminProduct>) => {
  const [enabledIds, setEnabledIds] = useState<string[] | null>(null)
  const [resolved, setResolved] = useState(false)

  useEffect(() => {
    let cancelled = false
    adminFetch<{
      brew_settings: { enabled_product_type_ids: string[] | null }
    }>("/admin/brew-settings")
      .then((r) => {
        if (cancelled) return
        setEnabledIds(r.brew_settings?.enabled_product_type_ids ?? [])
      })
      .catch(() => {
        if (cancelled) return
        setEnabledIds(null)
      })
      .finally(() => !cancelled && setResolved(true))
    return () => {
      cancelled = true
    }
  }, [])

  const isLinked = useMemo(() => {
    const typeId =
      (product as { type_id?: string | null }).type_id ??
      (product as { type?: { id?: string } }).type?.id
    const typeValue = (product as { type?: { value?: string } }).type?.value
    if (enabledIds && enabledIds.length > 0) {
      return !!typeId && enabledIds.includes(typeId)
    }
    // No setting configured → fall back to a product type with value
    // "coffee" so an unconfigured install still works out of the box.
    return (
      typeof typeValue === "string" &&
      typeValue.toLowerCase() === FALLBACK_PRODUCT_TYPE_VALUE
    )
  }, [product, enabledIds])

  if (!resolved) return null
  if (!isLinked) return null
  return <CoffeeBrewRecipes product={product} />
}

const CoffeeBrewRecipes = ({ product }: { product: AdminProduct }) => {
  const productId = product.id
  const [recipes, setRecipes] = useState<BrewRecipe[]>([])
  const [methods, setMethods] = useState<BrewMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [recipesRes, methodsRes] = await Promise.all([
        adminFetch<{ brew_recipes: BrewRecipe[] }>(
          `/admin/brew-recipes?product_id=${encodeURIComponent(productId)}`
        ),
        adminFetch<{ brew_methods: BrewMethod[] }>("/admin/brew-methods"),
      ])
      setRecipes(recipesRes.brew_recipes ?? [])
      setMethods(methodsRes.brew_methods ?? [])
    } catch (e) {
      toast.error("Failed to load brew data", {
        description: (e as Error).message,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [productId])

  async function deleteRecipe(r: BrewRecipe) {
    if (!confirm(`Remove "${r.title ?? r.brew_method?.name ?? "recipe"}"?`)) {
      return
    }
    try {
      await adminFetch(`/admin/brew-recipes/${r.id}`, { method: "DELETE" })
      toast.success("Recipe removed")
      load()
    } catch (e) {
      toast.error("Delete failed", { description: (e as Error).message })
    }
  }

  const linkedMethodIds = new Set(
    recipes.map((r) => r.brew_method?.id).filter(Boolean) as string[]
  )
  const availableMethods = methods.filter((m) => !linkedMethodIds.has(m.id))

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Brew recipes</Heading>
          <Text size="small" className="text-ui-fg-muted">
            Per-bean extraction values for each brew method.
          </Text>
        </div>
        <Button
          size="small"
          onClick={() => setAddOpen(true)}
          disabled={loading || availableMethods.length === 0}
        >
          {availableMethods.length === 0 && methods.length > 0
            ? "All methods linked"
            : "Add recipe"}
        </Button>
      </div>

      {loading ? (
        <Text className="px-6 py-6 text-ui-fg-muted">Loading…</Text>
      ) : methods.length === 0 ? (
        <div className="px-6 py-6">
          <Text className="text-ui-fg-muted">
            No brew methods have been created yet. Go to{" "}
            <a href="/app/brew-lab" className="text-ui-fg-interactive underline">
              Brew Lab
            </a>{" "}
            to add one.
          </Text>
        </div>
      ) : recipes.length === 0 && !addOpen ? (
        <Text className="px-6 py-6 text-ui-fg-muted">
          No recipes for this bean yet.
        </Text>
      ) : (
        <div className="flex flex-col divide-y divide-ui-border-base">
          {recipes.map((r) => (
            <RecipeRow
              key={r.id}
              recipe={r}
              onChanged={load}
              onDelete={() => deleteRecipe(r)}
            />
          ))}
        </div>
      )}

      {addOpen && (
        <AddRecipeForm
          productId={productId}
          methods={availableMethods}
          onCancel={() => setAddOpen(false)}
          onCreated={() => {
            setAddOpen(false)
            load()
          }}
        />
      )}
    </Container>
  )
}

const RecipeRow = ({
  recipe,
  onChanged,
  onDelete,
}: {
  recipe: BrewRecipe
  onChanged: () => void
  onDelete: () => void
}) => {
  const method = recipe.brew_method
  const schema = method?.param_schema ?? []
  const [title, setTitle] = useState(recipe.title ?? "")
  const [summary, setSummary] = useState(recipe.summary ?? "")
  const [params, setParams] = useState<Record<string, string>>(
    paramsAsStrings(recipe.params)
  )
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState(false)

  async function save() {
    setSaving(true)
    try {
      await adminFetch(`/admin/brew-recipes/${recipe.id}`, {
        method: "POST",
        body: JSON.stringify({
          title: title || null,
          summary: summary || null,
          params: cleanParams(params),
        }),
      })
      toast.success("Recipe updated")
      onChanged()
    } catch (e) {
      toast.error("Update failed", { description: (e as Error).message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-6 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Heading level="h3" className="text-base">
              {method?.name ?? "Unknown method"}
            </Heading>
            {method?.method_label && (
              <Badge size="2xsmall">{method.method_label}</Badge>
            )}
          </div>
          {title && (
            <Text size="small" className="mt-0.5">
              {title}
            </Text>
          )}
          {summary && (
            <Text size="small" className="text-ui-fg-muted line-clamp-2">
              {summary}
            </Text>
          )}
        </div>
        <div className="flex gap-1">
          <Button
            variant="secondary"
            size="small"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Close" : "Edit"}
          </Button>
          <Button
            variant="transparent"
            size="small"
            onClick={onDelete}
            className="text-ui-fg-error"
          >
            Delete
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Title">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="PRECISION CLARITY"
            />
          </Field>
          <Field label="Summary" colSpan>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Per-bean tasting note for this method."
              rows={2}
            />
          </Field>
          {schema.length > 0 && (
            <>
              {schema.map((p) => (
                <Field
                  key={p.key}
                  label={p.unit ? `${p.label} (${p.unit})` : p.label}
                >
                  <Input
                    value={params[p.key] ?? ""}
                    onChange={(e) =>
                      setParams({ ...params, [p.key]: e.target.value })
                    }
                  />
                </Field>
              ))}
            </>
          )}
          <div className="md:col-span-2 flex justify-end">
            <Button onClick={save} disabled={saving} isLoading={saving}>
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

const AddRecipeForm = ({
  productId,
  methods,
  onCancel,
  onCreated,
}: {
  productId: string
  methods: BrewMethod[]
  onCancel: () => void
  onCreated: () => void
}) => {
  const [methodId, setMethodId] = useState<string>(methods[0]?.id ?? "")
  const [title, setTitle] = useState("")
  const [summary, setSummary] = useState("")
  const [params, setParams] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const method = methods.find((m) => m.id === methodId) ?? null
  const schema = method?.param_schema ?? []

  async function create() {
    if (!methodId) {
      toast.error("Pick a brew method first")
      return
    }
    setSaving(true)
    try {
      await adminFetch("/admin/brew-recipes", {
        method: "POST",
        body: JSON.stringify({
          product_id: productId,
          brew_method_id: methodId,
          title: title || null,
          summary: summary || null,
          params: cleanParams(params),
        }),
      })
      toast.success("Recipe added")
      onCreated()
    } catch (e) {
      toast.error("Create failed", { description: (e as Error).message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border-t border-ui-border-base bg-ui-bg-subtle px-6 py-4">
      <div className="mb-3 flex items-center justify-between">
        <Heading level="h3" className="text-base">
          Add brew recipe
        </Heading>
        <div className="flex gap-2">
          <Button variant="secondary" size="small" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="small" onClick={create} disabled={saving} isLoading={saving}>
            Add
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label="Brew method *">
          <Select value={methodId} onValueChange={setMethodId}>
            <Select.Trigger>
              <Select.Value placeholder="Pick a method" />
            </Select.Trigger>
            <Select.Content>
              {methods.map((m) => (
                <Select.Item key={m.id} value={m.id}>
                  {m.name}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </Field>
        <Field label="Title">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="PRECISION CLARITY"
          />
        </Field>
        <Field label="Summary" colSpan>
          <Textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Per-bean tasting note for this method."
            rows={2}
          />
        </Field>
        {schema.length > 0 ? (
          schema.map((p) => (
            <Field
              key={p.key}
              label={p.unit ? `${p.label} (${p.unit})` : p.label}
            >
              <Input
                value={params[p.key] ?? ""}
                onChange={(e) =>
                  setParams({ ...params, [p.key]: e.target.value })
                }
              />
            </Field>
          ))
        ) : method ? (
          <div className="md:col-span-2">
            <Text size="small" className="text-ui-fg-muted">
              No params defined on this method. Add a param schema in{" "}
              <a href="/app/brew-lab" className="text-ui-fg-interactive underline">
                Brew Lab
              </a>{" "}
              if you want to capture per-bean values.
            </Text>
          </div>
        ) : null}
      </div>
    </div>
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

function paramsAsStrings(
  raw: Record<string, unknown> | null | undefined
): Record<string, string> {
  if (!raw) return {}
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(raw)) {
    if (v === null || v === undefined) continue
    out[k] = typeof v === "string" ? v : String(v)
  }
  return out
}

function cleanParams(p: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(p)) {
    if (k && v !== "") out[k] = v
  }
  return out
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductBrewRecipesWidget

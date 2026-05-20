"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Modal,
  FormRow,
  inputCls,
  btnPrimaryCls,
  btnGhostCls,
} from "@/components/modal"
import {
  createBrewRecipe,
  deleteBrewRecipe,
  updateBrewRecipe,
  type ParamSchemaItem,
  type StepDef,
} from "../brews/actions"

export type BrewMethodLite = {
  id: string
  slug: string
  name: string
  method_label?: string | null
  summary?: string | null
  param_schema?: ParamSchemaItem[] | null
}

export type BrewRecipeLite = {
  id: string
  product_id: string
  title?: string | null
  summary?: string | null
  params?: Record<string, unknown> | null
  steps?: StepDef[] | null
  brew_method: BrewMethodLite
}

type ActionRes = { ok: true; data?: unknown } | { ok: false; error: string }

export function ManageBrewsModal({
  open,
  onClose,
  productId,
  productTitle,
  methods,
  recipes,
}: {
  open: boolean
  onClose: () => void
  productId: string
  productTitle: string
  methods: BrewMethodLite[]
  recipes: BrewRecipeLite[]
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, startAct] = useTransition()

  function run(fn: () => Promise<ActionRes>) {
    setError(null)
    startAct(async () => {
      const res = await fn()
      if (!res.ok) setError(res.error)
      else router.refresh()
    })
  }

  const linkedMethodIds = new Set(recipes.map((r) => r.brew_method.id))
  const available = methods.filter((m) => !linkedMethodIds.has(m.id))

  function close() {
    if (pending) return
    setError(null)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Manage brews"
      subtitle={productTitle}
      size="lg"
    >
      {/* ── Link new method ── */}
      <section className="mb-5">
        <h3 className="mb-2 font-display text-xs font-bold uppercase tracking-[0.2em] text-mc-secondary">
          Link a method
        </h3>
        {methods.length === 0 ? (
          <p className="border border-mc-ink/20 bg-mc-ink/5 p-3 text-xs text-mc-secondary">
            No methods exist yet. Create one in the{" "}
            <strong className="font-bold">Brews</strong> tab first.
          </p>
        ) : available.length === 0 ? (
          <p className="border border-mc-ink/20 bg-mc-ink/5 p-3 text-xs text-mc-secondary">
            All methods are already linked to this product.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {available.map((m) => (
              <button
                key={m.id}
                type="button"
                disabled={pending}
                onClick={() =>
                  run(() =>
                    createBrewRecipe({
                      product_id: productId,
                      brew_method_id: m.id,
                      params:
                        m.param_schema?.reduce(
                          (acc, p) => ({ ...acc, [p.key]: "" }),
                          {} as Record<string, string>
                        ) ?? {},
                    })
                  )
                }
                className="border-2 border-mc-ink bg-mc-primary px-3 py-1.5 font-display text-[10px] font-bold uppercase tracking-[0.18em] text-mc-ink hover:bg-mc-accent hover:text-mc-surface disabled:opacity-50"
              >
                + {m.name}
                {m.method_label ? ` · ${m.method_label}` : ""}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── Linked recipes ── */}
      <section className="border-t border-mc-ink/15 pt-4">
        <h3 className="mb-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-mc-secondary">
          Linked recipes ({recipes.length})
        </h3>

        {recipes.length === 0 ? (
          <p className="border border-mc-ink/20 bg-mc-ink/5 p-4 text-sm text-mc-secondary">
            No brew recipes linked to this product yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {recipes.map((r) => (
              <RecipeEditor
                key={r.id}
                recipe={r}
                pending={pending}
                onAction={run}
              />
            ))}
          </ul>
        )}
      </section>

      {error && (
        <p className="mt-4 border-l-2 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-5 flex justify-end border-t border-mc-ink/15 pt-4">
        <button
          type="button"
          className={btnGhostCls}
          onClick={close}
          disabled={pending}
        >
          Close
        </button>
      </div>
    </Modal>
  )
}

/* ───────────────────────── Recipe editor ───────────────────────── */

function RecipeEditor({
  recipe,
  pending,
  onAction,
}: {
  recipe: BrewRecipeLite
  pending: boolean
  onAction: (fn: () => Promise<ActionRes>) => void
}) {
  const [open, setOpen] = useState(false)
  const schema =
    recipe.brew_method.param_schema?.length
      ? recipe.brew_method.param_schema
      : []

  const [title, setTitle] = useState(recipe.title || "")
  const [summary, setSummary] = useState(recipe.summary || "")
  const [params, setParams] = useState<Record<string, string>>(() => {
    const seed: Record<string, string> = {}
    for (const p of schema) {
      const v = (recipe.params as any)?.[p.key]
      seed[p.key] = v == null ? "" : String(v)
    }
    return seed
  })

  function save() {
    onAction(() =>
      updateBrewRecipe(recipe.id, {
        title: title || null,
        summary: summary || null,
        params,
      })
    )
  }

  function unlink() {
    if (
      !confirm(
        `Unlink "${recipe.brew_method.name}" from this product? The recipe and its custom values will be deleted.`
      )
    )
      return
    onAction(() => deleteBrewRecipe(recipe.id))
  }

  return (
    <li className="border-2 border-mc-ink/20">
      <header className="flex flex-wrap items-center gap-2 border-b border-mc-ink/15 bg-mc-ink/5 px-3 py-2">
        <div className="flex-1 min-w-0">
          <p className="font-display text-sm font-bold uppercase tracking-wide">
            {recipe.brew_method.name}
            {recipe.brew_method.method_label && (
              <span className="ml-2 text-[10px] font-bold tracking-[0.18em] text-mc-primary">
                {recipe.brew_method.method_label}
              </span>
            )}
          </p>
          {recipe.title && (
            <p className="text-[10px] text-mc-secondary truncate">{recipe.title}</p>
          )}
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => setOpen((v) => !v)}
          className="border border-mc-ink/30 px-2 py-1 font-display text-[10px] font-bold uppercase tracking-[0.16em] text-mc-secondary hover:border-mc-ink hover:text-mc-ink disabled:opacity-50"
        >
          {open ? "Collapse" : "Edit"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={unlink}
          className="border border-mc-ink/30 px-2 py-1 font-display text-[10px] font-bold uppercase tracking-[0.16em] text-red-700 hover:border-red-700 disabled:opacity-50"
        >
          Unlink
        </button>
      </header>

      {open && (
        <div className="space-y-4 p-3">
          <div className="grid grid-cols-2 gap-3">
            <FormRow label="Recipe title" hint="e.g. PRECISION CLARITY">
              <input
                className={inputCls}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </FormRow>
            <FormRow label="Summary" hint="Per-bean tasting note (overrides method default).">
              <input
                className={inputCls}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            </FormRow>
          </div>

          {schema.length > 0 && (
            <fieldset className="border-2 border-mc-ink/15 p-3">
              <legend className="px-2 font-display text-[10px] font-bold uppercase tracking-[0.18em] text-mc-secondary">
                Parameters
              </legend>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {schema.map((p) => (
                  <FormRow
                    key={p.key}
                    label={`${p.label}${p.unit ? ` (${p.unit})` : ""}`}
                  >
                    <input
                      className={inputCls}
                      value={params[p.key] ?? ""}
                      onChange={(e) =>
                        setParams((s) => ({ ...s, [p.key]: e.target.value }))
                      }
                      placeholder={p.unit || ""}
                    />
                  </FormRow>
                ))}
              </div>
            </fieldset>
          )}

          <p className="text-[11px] text-mc-secondary">
            Brew steps come from the method ({recipe.brew_method.name}) — edit them in
            the <strong className="font-bold">Brews</strong> tab to update every product
            using this method.
          </p>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="border-2 border-mc-ink bg-mc-ink px-4 py-2 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-mc-surface hover:bg-mc-accent hover:border-mc-accent disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save recipe"}
            </button>
          </div>
        </div>
      )}
    </li>
  )
}

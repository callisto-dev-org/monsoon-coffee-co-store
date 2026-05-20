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
  createBrewMethod,
  updateBrewMethod,
  type ParamSchemaItem,
  type StepDef,
} from "./actions"

export type EditableMethod = {
  id?: string
  slug: string
  name: string
  method_label?: string | null
  summary?: string | null
  image_url?: string | null
  param_schema?: ParamSchemaItem[] | null
  steps?: StepDef[] | null
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

const DEFAULT_PARAMS: ParamSchemaItem[] = [
  { key: "grain_size", label: "Grain size" },
  { key: "temp", label: "Temp", unit: "°C" },
  { key: "water", label: "Water", unit: "ml" },
  { key: "extraction", label: "Extraction", unit: "%" },
  { key: "yield", label: "Yield", unit: "ml" },
]

const DEFAULT_STEPS: StepDef[] = [
  { name: "Step 01", description: "" },
  { name: "Step 02", description: "" },
  { name: "Step 03", description: "" },
]

export function BrewMethodModal({
  open,
  onClose,
  method,
}: {
  open: boolean
  onClose: () => void
  method?: EditableMethod | null
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const editing = Boolean(method?.id)
  const [name, setName] = useState(method?.name || "")
  const [slug, setSlug] = useState(method?.slug || "")
  const [methodLabel, setMethodLabel] = useState(method?.method_label || "")
  const [summary, setSummary] = useState(method?.summary || "")
  const [imageUrl, setImageUrl] = useState(method?.image_url || "")
  const [params, setParams] = useState<ParamSchemaItem[]>(
    method?.param_schema?.length ? method.param_schema : DEFAULT_PARAMS
  )
  const [steps, setSteps] = useState<StepDef[]>(
    method?.steps?.length ? method.steps : DEFAULT_STEPS
  )

  function setParam(i: number, patch: Partial<ParamSchemaItem>) {
    setParams((p) => p.map((x, idx) => (idx === i ? { ...x, ...patch } : x)))
  }
  function addParam() {
    setParams((p) => [...p, { key: "", label: "" }])
  }
  function removeParam(i: number) {
    setParams((p) => p.filter((_, idx) => idx !== i))
  }

  function setStep(i: number, patch: Partial<StepDef>) {
    setSteps((s) => s.map((x, idx) => (idx === i ? { ...x, ...patch } : x)))
  }
  function addStep() {
    setSteps((s) => [
      ...s,
      { name: `Step ${String(s.length + 1).padStart(2, "0")}`, description: "" },
    ])
  }
  function removeStep(i: number) {
    setSteps((s) => s.filter((_, idx) => idx !== i))
  }

  function submit() {
    setError(null)
    const cleanParams = params
      .map((p) => ({
        key: p.key.trim(),
        label: p.label.trim(),
        unit: p.unit?.trim() || undefined,
      }))
      .filter((p) => p.key && p.label)

    const cleanSteps = steps
      .map((s) => ({
        name: s.name.trim(),
        description: s.description.trim(),
      }))
      .filter((s) => s.name && s.description)

    const payload: any = {
      slug: (slug || slugify(name)).trim(),
      name: name.trim(),
      method_label: methodLabel || null,
      summary: summary || null,
      image_url: imageUrl || null,
      param_schema: cleanParams.length ? cleanParams : null,
      steps: cleanSteps.length ? cleanSteps : null,
    }

    start(async () => {
      const res = editing
        ? await updateBrewMethod(method!.id!, payload)
        : await createBrewMethod(payload)
      if (res.ok) {
        router.refresh()
        onClose()
      } else setError(res.error)
    })
  }

  return (
    <Modal
      open={open}
      onClose={() => !pending && onClose()}
      title={editing ? "Edit brew method" : "New brew method"}
      subtitle={
        editing
          ? method?.id
          : "Shared template — per-bean values live on each recipe."
      }
      size="lg"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="space-y-5"
      >
        <div className="grid grid-cols-2 gap-4">
          <FormRow label="Name">
            <input
              className={inputCls}
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (!editing && !slug) setSlug(slugify(e.target.value))
              }}
              placeholder="V60"
              required
              autoFocus
            />
          </FormRow>
          <FormRow label="Slug" hint="lowercase, dashed; used in URLs.">
            <input
              className={inputCls}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="v60"
              required
            />
          </FormRow>
          <FormRow label="Method label">
            <input
              className={inputCls}
              value={methodLabel}
              onChange={(e) => setMethodLabel(e.target.value)}
              placeholder="POUR-OVER"
            />
          </FormRow>
        </div>

        <FormRow label="Summary">
          <textarea
            className={inputCls + " min-h-[80px]"}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="What this method delivers in the cup."
          />
        </FormRow>

        <FormRow label="Image URL">
          <input
            className={inputCls}
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://…"
          />
        </FormRow>

        <fieldset className="border-2 border-mc-ink/20 p-3">
          <legend className="px-2 font-display text-[10px] font-bold uppercase tracking-[0.18em] text-mc-secondary">
            Parameter schema
          </legend>
          <p className="mb-2 text-[11px] text-mc-secondary">
            Defines which dials appear on the Manage Brews modal per product. The
            <em> values </em>are set per recipe.
          </p>
          <div className="space-y-2">
            {params.map((p, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_120px_auto] gap-2">
                <input
                  className={inputCls}
                  value={p.key}
                  onChange={(e) => setParam(i, { key: e.target.value })}
                  placeholder="key (grain_size)"
                />
                <input
                  className={inputCls}
                  value={p.label}
                  onChange={(e) => setParam(i, { label: e.target.value })}
                  placeholder="label (Grain size)"
                />
                <input
                  className={inputCls}
                  value={p.unit ?? ""}
                  onChange={(e) => setParam(i, { unit: e.target.value })}
                  placeholder="unit"
                />
                <button
                  type="button"
                  onClick={() => removeParam(i)}
                  disabled={pending}
                  className="border border-mc-ink/30 px-2 font-display text-[10px] font-bold uppercase tracking-[0.16em] text-red-700 hover:border-red-700"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addParam}
              disabled={pending}
              className="border border-mc-ink/30 px-3 py-1.5 font-display text-[10px] font-bold uppercase tracking-[0.16em] text-mc-secondary hover:border-mc-ink hover:text-mc-ink"
            >
              + Add parameter
            </button>
          </div>
        </fieldset>

        <fieldset className="border-2 border-mc-ink/20 p-3">
          <legend className="px-2 font-display text-[10px] font-bold uppercase tracking-[0.18em] text-mc-secondary">
            Steps
          </legend>
          <p className="mb-2 text-[11px] text-mc-secondary">
            The brewing technique — shared across every bean using this method.
            Recipes inherit these by default.
          </p>
          <div className="space-y-2">
            {steps.map((s, i) => (
              <div key={i} className="grid grid-cols-[120px_1fr_auto] gap-2">
                <input
                  className={inputCls}
                  value={s.name}
                  onChange={(e) => setStep(i, { name: e.target.value })}
                  placeholder={`Step ${String(i + 1).padStart(2, "0")}`}
                />
                <input
                  className={inputCls}
                  value={s.description}
                  onChange={(e) => setStep(i, { description: e.target.value })}
                  placeholder="Describe what to do…"
                />
                <button
                  type="button"
                  onClick={() => removeStep(i)}
                  disabled={pending}
                  className="border border-mc-ink/30 px-2 font-display text-[10px] font-bold uppercase tracking-[0.16em] text-red-700 hover:border-red-700"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addStep}
              disabled={pending}
              className="border border-mc-ink/30 px-3 py-1.5 font-display text-[10px] font-bold uppercase tracking-[0.16em] text-mc-secondary hover:border-mc-ink hover:text-mc-ink"
            >
              + Add step
            </button>
          </div>
        </fieldset>

        {error && (
          <p className="border-l-2 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            className={btnGhostCls}
            onClick={onClose}
            disabled={pending}
          >
            Cancel
          </button>
          <button type="submit" className={btnPrimaryCls} disabled={pending}>
            {pending ? "Saving…" : editing ? "Save method" : "Create method"}
          </button>
        </div>
      </form>
    </Modal>
  )
}

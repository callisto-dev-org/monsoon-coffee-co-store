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
  createOption,
  createVariant,
  deleteOption,
  deleteVariant,
  updateOption,
  updateVariant,
} from "./actions"
import type { ManagedProduct, ManagedVariant } from "./types"

export type { ManagedProduct, ManagedVariant } from "./types"

type ActionRes = { ok: true; data?: unknown } | { ok: false; error: string }

export function ManageVariantsModal({
  open,
  onClose,
  product,
  currencies,
}: {
  open: boolean
  onClose: () => void
  product: ManagedProduct
  currencies: string[]
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, startAct] = useTransition()

  function close() {
    if (pending) return
    setError(null)
    setAddVariantOpen(false)
    setAddGroupOpen(false)
    onClose()
  }

  function run(fn: () => Promise<ActionRes>) {
    setError(null)
    startAct(async () => {
      const res = await fn()
      if (!res.ok) setError(res.error)
      else router.refresh()
    })
  }

  /* ── add group ── */
  const [addGroupOpen, setAddGroupOpen] = useState(false)
  const [newGroupTitle, setNewGroupTitle] = useState("")
  const [newGroupValues, setNewGroupValues] = useState("")

  function submitAddGroup() {
    const values = newGroupValues
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    if (!newGroupTitle.trim() || !values.length) {
      setError("Group title and at least one value are required.")
      return
    }
    run(async () => {
      const r = await createOption({
        productId: product.id,
        title: newGroupTitle.trim(),
        values,
      })
      if (r.ok) {
        setNewGroupTitle("")
        setNewGroupValues("")
        setAddGroupOpen(false)
      }
      return r
    })
  }

  /* ── add variant ── */
  const [addVariantOpen, setAddVariantOpen] = useState(false)
  const [vTitle, setVTitle] = useState("")
  const [vSku, setVSku] = useState("")
  const [vPrice, setVPrice] = useState("")
  const [vCurrency, setVCurrency] = useState(currencies[0] || "usd")
  const [vStock, setVStock] = useState("")
  const [vOpts, setVOpts] = useState<Record<string, string>>({})

  function openAddVariant() {
    setVTitle("")
    setVSku("")
    setVPrice("")
    setVStock("")
    setVOpts(
      Object.fromEntries(product.options.map((o) => [o.title, o.values[0] || ""]))
    )
    setAddVariantOpen(true)
  }

  function submitAddVariant() {
    if (!vTitle.trim()) {
      setError("Variant title is required.")
      return
    }
    if (product.options.length > 0 && Object.values(vOpts).some((v) => !v?.trim())) {
      setError("Pick or enter a value for every option group.")
      return
    }
    run(async () => {
      const r = await createVariant({
        productId: product.id,
        title: vTitle,
        sku: vSku || undefined,
        price: vPrice ? Number(vPrice) : undefined,
        currency_code: vPrice ? vCurrency : undefined,
        initial_stock: vStock ? Number(vStock) : undefined,
        optionValues: vOpts,
      })
      if (r.ok) setAddVariantOpen(false)
      return r
    })
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Manage variants"
      subtitle={product.title}
      size="lg"
    >
      {/* ── Variant groups ── */}
      <section className="mb-6">
        <header className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-mc-secondary">
            Variant groups
          </h3>
          <button
            type="button"
            onClick={() => setAddGroupOpen((v) => !v)}
            disabled={pending}
            className="border border-mc-ink/30 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-[0.16em] text-mc-secondary hover:border-mc-ink hover:text-mc-ink disabled:opacity-50"
          >
            {addGroupOpen ? "× Cancel" : "+ Add group"}
          </button>
        </header>

        {addGroupOpen && (
          <div className="mb-3 border-2 border-mc-primary bg-mc-primary/5 p-3">
            <div className="grid grid-cols-2 gap-3">
              <FormRow label="Group title">
                <input
                  className={inputCls}
                  value={newGroupTitle}
                  onChange={(e) => setNewGroupTitle(e.target.value)}
                  placeholder="Size, Color, Roast…"
                  autoFocus
                />
              </FormRow>
              <FormRow label="Initial values" hint="Comma-separated.">
                <input
                  className={inputCls}
                  value={newGroupValues}
                  onChange={(e) => setNewGroupValues(e.target.value)}
                  placeholder="S, M, L"
                />
              </FormRow>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                className={btnGhostCls}
                onClick={() => setAddGroupOpen(false)}
                disabled={pending}
              >
                Cancel
              </button>
              <button
                type="button"
                className={btnPrimaryCls}
                onClick={submitAddGroup}
                disabled={pending}
              >
                {pending ? "Adding…" : "Add group"}
              </button>
            </div>
          </div>
        )}

        {product.options.length === 0 ? (
          <p className="border border-mc-ink/20 bg-mc-ink/5 p-3 text-xs text-mc-secondary">
            No groups yet. Add one (e.g. “Size” with values “S, M, L”) so variants can be
            distinguished.
          </p>
        ) : (
          <ul className="space-y-2">
            {product.options.map((opt) => (
              <OptionRow
                key={opt.id}
                productId={product.id}
                option={opt}
                pending={pending}
                onAction={run}
              />
            ))}
          </ul>
        )}
      </section>

      {/* ── Variants ── */}
      <section className="border-t border-mc-ink/15 pt-4">
        <header className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-mc-secondary">
            Variants ({product.variants.length})
          </h3>
          <button
            type="button"
            onClick={openAddVariant}
            disabled={pending}
            className="border-2 border-mc-ink bg-mc-primary px-3 py-1.5 font-display text-[10px] font-bold uppercase tracking-[0.18em] text-mc-ink transition hover:bg-mc-accent hover:text-mc-surface disabled:opacity-50"
          >
            + Add variant
          </button>
        </header>

        {addVariantOpen && (
          <div className="mb-4 border-2 border-mc-primary bg-mc-primary/5 p-4">
            <p className="mb-3 font-display text-[10px] font-bold uppercase tracking-[0.18em] text-mc-accent">
              New variant
            </p>
            <div className="grid grid-cols-2 gap-3">
              <FormRow label="Title">
                <input
                  className={inputCls}
                  value={vTitle}
                  onChange={(e) => setVTitle(e.target.value)}
                  placeholder="e.g. Small / Red"
                  autoFocus
                />
              </FormRow>
              <FormRow label="SKU">
                <input
                  className={inputCls}
                  value={vSku}
                  onChange={(e) => setVSku(e.target.value)}
                />
              </FormRow>
              <FormRow label="Price">
                <div className="flex gap-2">
                  <input
                    className={inputCls}
                    type="number"
                    step="0.01"
                    min="0"
                    value={vPrice}
                    onChange={(e) => setVPrice(e.target.value)}
                    placeholder="0.00"
                  />
                  <select
                    className={inputCls + " w-24"}
                    value={vCurrency}
                    onChange={(e) => setVCurrency(e.target.value)}
                  >
                    {(currencies.length ? currencies : ["usd"]).map((c) => (
                      <option key={c} value={c}>
                        {c.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </FormRow>
              <FormRow label="Initial stock" hint="At first location.">
                <input
                  className={inputCls}
                  type="number"
                  min="0"
                  value={vStock}
                  onChange={(e) => setVStock(e.target.value)}
                  placeholder="0"
                />
              </FormRow>
            </div>

            {product.options.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                {product.options.map((opt) => (
                  <FormRow key={opt.id} label={opt.title}>
                    <select
                      className={inputCls}
                      value={vOpts[opt.title] ?? ""}
                      onChange={(e) =>
                        setVOpts((s) => ({ ...s, [opt.title]: e.target.value }))
                      }
                    >
                      {opt.values.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </FormRow>
                ))}
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className={btnGhostCls}
                onClick={() => setAddVariantOpen(false)}
                disabled={pending}
              >
                Cancel
              </button>
              <button
                type="button"
                className={btnPrimaryCls}
                onClick={submitAddVariant}
                disabled={pending}
              >
                {pending ? "Adding…" : "Add variant"}
              </button>
            </div>
          </div>
        )}

        {product.variants.length === 0 ? (
          <p className="border border-mc-ink/20 bg-mc-ink/5 p-4 text-sm text-mc-secondary">
            No variants yet. Use “+ Add variant” to create one.
          </p>
        ) : (
          <ul className="space-y-2">
            {product.variants.map((v) => (
              <VariantRow
                key={v.id}
                productId={product.id}
                variant={v}
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

/* ───────────────────────── Option row ───────────────────────── */

function OptionRow({
  productId,
  option,
  pending,
  onAction,
}: {
  productId: string
  option: { id: string; title: string; values: string[] }
  pending: boolean
  onAction: (fn: () => Promise<ActionRes>) => void
}) {
  const [titleDraft, setTitleDraft] = useState(option.title)
  const [newValue, setNewValue] = useState("")
  const titleDirty = titleDraft.trim() !== option.title

  return (
    <li className="border-2 border-mc-ink/20 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          className="border-2 border-mc-ink/20 bg-transparent px-2 py-1 font-display text-sm font-bold uppercase tracking-wide outline-none focus:border-mc-primary"
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
        />
        {titleDirty && (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              onAction(() =>
                updateOption({ productId, optionId: option.id, title: titleDraft })
              )
            }
            className="border-2 border-mc-ink bg-mc-ink px-2 py-1 font-display text-[10px] font-bold uppercase tracking-[0.16em] text-mc-surface hover:bg-mc-accent hover:border-mc-accent disabled:opacity-50"
          >
            Rename
          </button>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!confirm(`Delete option group "${option.title}"?`)) return
            onAction(() => deleteOption({ productId, optionId: option.id }))
          }}
          className="ml-auto border border-mc-ink/30 px-2 py-1 font-display text-[10px] font-bold uppercase tracking-[0.16em] text-red-700 hover:border-red-700 disabled:opacity-50"
        >
          Delete
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {option.values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 border border-mc-ink/30 bg-mc-ink/5 pl-2 pr-1 py-0.5 font-display text-[11px] font-bold uppercase tracking-wide"
          >
            {v}
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                onAction(() =>
                  updateOption({
                    productId,
                    optionId: option.id,
                    values: option.values.filter((x) => x !== v),
                  })
                )
              }
              className="ml-1 grid h-4 w-4 place-items-center text-mc-secondary hover:bg-red-100 hover:text-red-700 disabled:opacity-50"
              aria-label={`Remove ${v}`}
            >
              ×
            </button>
          </span>
        ))}
        <div className="ml-2 inline-flex">
          <input
            className="w-28 border-2 border-mc-ink/30 bg-transparent px-2 py-1 text-xs outline-none focus:border-mc-primary"
            placeholder="add value"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                const v = newValue.trim()
                if (!v) return
                onAction(() =>
                  updateOption({
                    productId,
                    optionId: option.id,
                    values: [...option.values, v],
                  })
                )
                setNewValue("")
              }
            }}
          />
          <button
            type="button"
            disabled={pending || !newValue.trim()}
            onClick={() => {
              const v = newValue.trim()
              if (!v) return
              onAction(() =>
                updateOption({
                  productId,
                  optionId: option.id,
                  values: [...option.values, v],
                })
              )
              setNewValue("")
            }}
            className="border-2 border-l-0 border-mc-ink/30 px-2 font-display text-[10px] font-bold uppercase tracking-[0.16em] text-mc-secondary hover:border-mc-ink hover:text-mc-ink disabled:opacity-50"
          >
            +
          </button>
        </div>
      </div>
    </li>
  )
}

/* ───────────────────────── Variant row ───────────────────────── */

function VariantRow({
  productId,
  variant,
  pending,
  onAction,
}: {
  productId: string
  variant: ManagedVariant
  pending: boolean
  onAction: (fn: () => Promise<ActionRes>) => void
}) {
  const [editing, setEditing] = useState(false)
  const [titleDraft, setTitleDraft] = useState(variant.title)
  const [skuDraft, setSkuDraft] = useState(variant.sku || "")

  function saveEdit() {
    onAction(() =>
      updateVariant({
        productId,
        variantId: variant.id,
        title: titleDraft,
        sku: skuDraft,
      })
    )
    setEditing(false)
  }

  const optionLabel = Object.entries(variant.optionValues)
    .map(([k, v]) => `${k}: ${v}`)
    .join("  ·  ")

  return (
    <li className="border-2 border-mc-ink/20">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2">
        {!editing ? (
          <>
            <div className="flex-1 min-w-0">
              <p className="font-display text-sm font-bold uppercase tracking-wide">
                {variant.title}
              </p>
              <p className="text-[10px] text-mc-secondary">
                {variant.sku && <span className="font-mono">{variant.sku}</span>}
                {variant.sku && optionLabel && " · "}
                {optionLabel}
              </p>
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setTitleDraft(variant.title)
                setSkuDraft(variant.sku || "")
                setEditing(true)
              }}
              className="border border-mc-ink/30 px-2 py-1 font-display text-[10px] font-bold uppercase tracking-[0.16em] text-mc-secondary hover:border-mc-ink hover:text-mc-ink disabled:opacity-50"
            >
              Edit
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (!confirm(`Delete variant "${variant.title}"?`)) return
                onAction(() => deleteVariant({ productId, variantId: variant.id }))
              }}
              className="border border-mc-ink/30 px-2 py-1 font-display text-[10px] font-bold uppercase tracking-[0.16em] text-red-700 hover:border-red-700 disabled:opacity-50"
            >
              Delete
            </button>
          </>
        ) : (
          <>
            <input
              className="flex-1 border-2 border-mc-ink/30 bg-transparent px-2 py-1 text-sm outline-none focus:border-mc-primary"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              placeholder="Title"
            />
            <input
              className="w-40 border-2 border-mc-ink/30 bg-transparent px-2 py-1 font-mono text-xs outline-none focus:border-mc-primary"
              value={skuDraft}
              onChange={(e) => setSkuDraft(e.target.value)}
              placeholder="SKU"
            />
            <button
              type="button"
              disabled={pending}
              onClick={saveEdit}
              className="border-2 border-mc-ink bg-mc-ink px-3 py-1 font-display text-[10px] font-bold uppercase tracking-[0.16em] text-mc-surface hover:bg-mc-accent hover:border-mc-accent disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setEditing(false)}
              className="border border-mc-ink/30 px-2 py-1 font-display text-[10px] font-bold uppercase tracking-[0.16em] text-mc-secondary hover:border-mc-ink hover:text-mc-ink disabled:opacity-50"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </li>
  )
}

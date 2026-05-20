"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Modal, btnPrimaryCls, btnGhostCls } from "@/components/modal"
import { updateStockBulk } from "./actions"
import type { ManagedProduct } from "./types"

export function ManageInventoryModal({
  open,
  onClose,
  product,
}: {
  open: boolean
  onClose: () => void
  product: ManagedProduct
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [savePending, startSave] = useTransition()

  // Flatten every (variant, inventoryItem, level) into a single array for editing
  const allLevels = useMemo(
    () =>
      product.variants.flatMap((v) =>
        v.inventoryItems.flatMap((ii) =>
          ii.levels.map((l) => ({
            ...l,
            _inv_item_id: ii.id,
            _variant_id: v.id,
          }))
        )
      ),
    [product.variants]
  )

  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(allLevels.map((l) => [l.id, String(l.stocked_quantity)]))
  )

  // Merge new levels (e.g. after a variant was added in the Variants modal) without
  // clobbering edits already in progress.
  useEffect(() => {
    setValues((cur) => {
      const next = { ...cur }
      for (const l of allLevels) {
        if (!(l.id in next)) next[l.id] = String(l.stocked_quantity)
      }
      return next
    })
  }, [allLevels])

  // Filter by option-value: per option, set of selected values. Empty = no filter.
  const [filter, setFilter] = useState<Record<string, Set<string>>>({})

  function toggleFilter(optTitle: string, val: string) {
    setFilter((cur) => {
      const next: Record<string, Set<string>> = {}
      for (const k of Object.keys(cur)) next[k] = new Set(cur[k])
      const s = next[optTitle] ?? new Set<string>()
      if (s.has(val)) s.delete(val)
      else s.add(val)
      if (s.size) next[optTitle] = s
      else delete next[optTitle]
      return next
    })
  }

  const filteredVariants = useMemo(() => {
    const keys = Object.keys(filter)
    if (!keys.length) return product.variants
    return product.variants.filter((v) =>
      keys.every((k) => filter[k].has(v.optionValues[k] ?? ""))
    )
  }, [product.variants, filter])

  const dirtyCount = useMemo(() => {
    let n = 0
    for (const l of allLevels) {
      if (Number(values[l.id]) !== l.stocked_quantity) n++
    }
    return n
  }, [values, allLevels])

  function close() {
    if (savePending) return
    setError(null)
    onClose()
  }

  function submit() {
    const changes = allLevels
      .filter((l) => {
        const v = values[l.id]
        return /^-?\d+$/.test(v) && Number(v) !== l.stocked_quantity
      })
      .map((l) => ({
        inventory_item_id: l._inv_item_id,
        location_id: l.location_id,
        stocked_quantity: Number(values[l.id]),
      }))
    if (!changes.length) {
      onClose()
      return
    }
    setError(null)
    startSave(async () => {
      const res = await updateStockBulk(changes)
      if (res.ok) {
        router.refresh()
        onClose()
      } else setError(res.error)
    })
  }

  const locName = (id: string) =>
    product.locations.find((l) => l.id === id)?.name || id

  return (
    <Modal
      open={open}
      onClose={close}
      title="Manage inventory"
      subtitle={product.title}
      size="lg"
    >
      {product.variants.length === 0 ? (
        <p className="border border-mc-ink/20 bg-mc-ink/5 p-4 text-sm text-mc-secondary">
          No variants yet. Add variants from{" "}
          <strong className="font-bold">Manage variants</strong> first, then come back to
          set stock.
        </p>
      ) : (
        <>
          {/* Filter chips grouped by option */}
          {product.options.length > 0 && (
            <section className="mb-5">
              <header className="mb-2 flex items-center justify-between">
                <h3 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-mc-secondary">
                  Filter variants
                </h3>
                {Object.keys(filter).length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilter({})}
                    className="text-[10px] uppercase tracking-widest text-mc-secondary hover:text-mc-ink"
                  >
                    clear
                  </button>
                )}
              </header>
              <div className="space-y-2">
                {product.options.map((opt) => (
                  <div key={opt.id} className="flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 min-w-[64px] text-[10px] font-bold uppercase tracking-[0.18em] text-mc-secondary">
                      {opt.title}
                    </span>
                    {opt.values.map((val) => {
                      const active = filter[opt.title]?.has(val) ?? false
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => toggleFilter(opt.title, val)}
                          className={`border px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-[0.16em] transition ${
                            active
                              ? "border-mc-ink bg-mc-ink text-mc-surface"
                              : "border-mc-ink/30 text-mc-secondary hover:border-mc-ink hover:text-mc-ink"
                          }`}
                        >
                          {val}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Stock table per variant */}
          <section>
            <header className="mb-2 flex items-center justify-between">
              <h3 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-mc-secondary">
                Stock ({filteredVariants.length}
                {filteredVariants.length !== product.variants.length
                  ? ` / ${product.variants.length}`
                  : ""}
                )
              </h3>
            </header>

            {filteredVariants.length === 0 ? (
              <p className="border border-mc-ink/20 bg-mc-ink/5 p-3 text-xs text-mc-secondary">
                No variants match the active filters.
              </p>
            ) : (
              <ul className="space-y-3">
                {filteredVariants.map((v) => {
                  const optionLabel = Object.entries(v.optionValues)
                    .map(([k, val]) => `${k}: ${val}`)
                    .join("  ·  ")
                  const flatLevels = v.inventoryItems.flatMap((ii) =>
                    ii.levels.map((l) => ({ ...l, _inv_item_id: ii.id, _sku: ii.sku }))
                  )
                  return (
                    <li key={v.id} className="border-2 border-mc-ink/20">
                      <header className="border-b border-mc-ink/15 bg-mc-ink/5 px-3 py-2">
                        <p className="font-display text-sm font-bold uppercase tracking-wide">
                          {v.title}
                        </p>
                        <p className="text-[10px] text-mc-secondary">
                          {v.sku && <span className="font-mono">{v.sku}</span>}
                          {v.sku && optionLabel && " · "}
                          {optionLabel}
                        </p>
                      </header>

                      {flatLevels.length === 0 ? (
                        <p className="px-3 py-2 text-xs text-mc-secondary">
                          No inventory level linked.
                        </p>
                      ) : (
                        <table className="w-full text-sm">
                          <thead className="text-[10px] uppercase tracking-[0.18em] text-mc-secondary">
                            <tr>
                              <th className="px-3 py-2 text-left">Location</th>
                              <th className="px-3 py-2 text-right">Reserved</th>
                              <th className="px-3 py-2 text-right w-40">On hand</th>
                            </tr>
                          </thead>
                          <tbody>
                            {flatLevels.map((lvl) => {
                              const val = values[lvl.id] ?? String(lvl.stocked_quantity)
                              const dirty = Number(val) !== lvl.stocked_quantity
                              const numeric = /^-?\d+$/.test(val)
                              return (
                                <tr key={lvl.id} className="border-t border-mc-ink/10">
                                  <td className="px-3 py-2">{locName(lvl.location_id)}</td>
                                  <td className="px-3 py-2 text-right tabular-nums text-mc-secondary">
                                    {lvl.reserved_quantity ?? 0}
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      className={`w-full border-2 px-2 py-1.5 text-right font-mono tabular-nums outline-none ${
                                        !numeric
                                          ? "border-red-400 bg-red-50"
                                          : dirty
                                          ? "border-mc-primary bg-mc-primary/10"
                                          : "border-mc-ink/30"
                                      } focus:border-mc-primary`}
                                      value={val}
                                      onChange={(e) =>
                                        setValues((s) => ({
                                          ...s,
                                          [lvl.id]: e.target.value,
                                        }))
                                      }
                                    />
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </>
      )}

      {error && (
        <p className="mt-4 border-l-2 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-mc-ink/15 pt-4">
        <span className="text-xs text-mc-secondary">
          {dirtyCount === 0
            ? "No changes."
            : `${dirtyCount} change${dirtyCount > 1 ? "s" : ""} pending.`}
        </span>
        <div className="flex gap-3">
          <button
            type="button"
            className={btnGhostCls}
            onClick={close}
            disabled={savePending}
          >
            Cancel
          </button>
          <button
            type="button"
            className={btnPrimaryCls}
            onClick={submit}
            disabled={savePending || dirtyCount === 0}
          >
            {savePending ? "Saving…" : `Save ${dirtyCount || ""}`.trim()}
          </button>
        </div>
      </div>
    </Modal>
  )
}

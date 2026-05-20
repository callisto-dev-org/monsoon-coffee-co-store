"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { BrewMethodModal, type EditableMethod } from "./brew-method-modal"
import { deleteBrewMethod } from "./actions"
import type { BrewMethod } from "./page"

export function BrewsView({ methods }: { methods: BrewMethod[] }) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<EditableMethod | null>(null)
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function openNew() {
    setEditing(null)
    setModalOpen(true)
  }
  function openEdit(m: BrewMethod) {
    setEditing({ ...m })
    setModalOpen(true)
  }

  function remove(m: BrewMethod) {
    if (
      !confirm(
        `Delete brew method "${m.name}"?\n\nThis also unlinks it from ${
          m.recipe_count || 0
        } recipe${m.recipe_count === 1 ? "" : "s"}.`
      )
    )
      return
    setError(null)
    start(async () => {
      const res = await deleteBrewMethod(m.id)
      if (!res.ok) setError(res.error)
      else router.refresh()
    })
  }

  return (
    <div>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.24em] text-mc-primary">
            Brew Lab
          </p>
          <h1 className="mt-1 font-display text-3xl font-black uppercase">
            Extraction methods
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-mc-secondary">
            Shared protocols (V60, French Press, AeroPress…). Per-bean values
            (grain size, temperature, etc.) live on each product's recipe — set
            them from <strong className="font-bold">Manage brews</strong> on a
            product.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="border-2 border-mc-ink bg-mc-primary px-4 py-2.5 font-display text-xs font-bold uppercase tracking-[0.18em] text-mc-ink shadow-[3px_3px_0px_0px_rgb(var(--mc-ink-rgb))] hover:bg-mc-accent hover:text-mc-surface"
        >
          + New method
        </button>
      </header>

      {error && (
        <p className="mb-4 border-l-2 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {methods.length === 0 ? (
        <div className="border-2 border-dashed border-mc-ink/30 bg-mc-surface/50 p-8 text-center text-sm text-mc-secondary">
          No brew methods yet. Click{" "}
          <strong className="font-bold">+ New method</strong> to seed one.
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {methods.map((m) => (
            <li
              key={m.id}
              className="flex flex-col border-2 border-mc-ink bg-mc-surface shadow-[4px_4px_0px_0px_rgb(var(--mc-ink-rgb))]"
            >
              {m.image_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={m.image_url}
                  alt=""
                  className="h-32 w-full border-b-2 border-mc-ink object-cover"
                />
              ) : (
                <div className="grid h-32 place-items-center border-b-2 border-mc-ink bg-mc-ink/5 font-display text-3xl font-black uppercase text-mc-ink/40">
                  {m.name?.[0] ?? "·"}
                </div>
              )}
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-display text-lg font-black uppercase tracking-wide">
                    {m.name}
                  </h2>
                  <span className="font-mono text-[10px] text-mc-secondary">
                    /{m.slug}
                  </span>
                </div>
                {m.method_label && (
                  <p className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-mc-primary">
                    {m.method_label}
                  </p>
                )}
                {m.summary && (
                  <p className="text-sm text-mc-secondary line-clamp-3">
                    {m.summary}
                  </p>
                )}
                <p className="text-[10px] uppercase tracking-widest text-mc-secondary">
                  {(m.param_schema?.length ?? 0)} parameter
                  {(m.param_schema?.length ?? 0) === 1 ? "" : "s"} ·{" "}
                  {m.recipe_count ?? 0} recipe
                  {m.recipe_count === 1 ? "" : "s"}
                </p>
                <div className="mt-auto flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => openEdit(m)}
                    disabled={pending}
                    className="flex-1 border-2 border-mc-ink/30 px-3 py-1.5 font-display text-[10px] font-bold uppercase tracking-[0.18em] text-mc-secondary hover:border-mc-ink hover:text-mc-ink disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(m)}
                    disabled={pending}
                    className="flex-1 border-2 border-mc-ink/30 px-3 py-1.5 font-display text-[10px] font-bold uppercase tracking-[0.18em] text-red-700 hover:border-red-700 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <BrewMethodModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        method={editing}
      />
    </div>
  )
}

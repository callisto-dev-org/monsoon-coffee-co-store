"use client"

import { useState } from "react"
import { AddProductModal } from "./add-product-modal"

export function AddProductButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border-2 border-mc-ink bg-mc-primary px-4 py-2.5 font-display text-xs font-bold uppercase tracking-[0.18em] text-mc-ink shadow-[3px_3px_0px_0px_rgb(var(--mc-ink-rgb))] transition hover:bg-mc-accent hover:text-mc-surface"
      >
        + New product
      </button>
      <AddProductModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}

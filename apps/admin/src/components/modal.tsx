"use client"

import { useEffect } from "react"
import { createPortal } from "react-dom"

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  size = "md",
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  size?: "md" | "lg"
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [open, onClose])

  if (!open) return null
  if (typeof document === "undefined") return null

  const widthClass = size === "lg" ? "max-w-3xl" : "max-w-xl"

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-mc-ink/40 p-4 sm:p-8"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={`w-full ${widthClass} border-2 border-mc-ink bg-mc-surface shadow-[8px_8px_0px_0px_rgb(var(--mc-ink-rgb))]`}
      >
        <header className="flex items-start gap-4 border-b-2 border-mc-ink px-6 py-4">
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-xl font-black uppercase">{title}</h2>
            {subtitle && (
              <p className="mt-1 text-xs text-mc-secondary">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-auto -mr-2 -mt-2 border border-transparent p-2 text-mc-secondary hover:border-mc-ink hover:text-mc-ink"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 3l10 10M13 3L3 13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="square"
              />
            </svg>
          </button>
        </header>
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body
  )
}

export function FormRow({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-mc-secondary">
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block text-[11px] text-mc-secondary">{hint}</span>}
    </label>
  )
}

export const inputCls =
  "w-full border-2 border-mc-ink/30 bg-transparent px-3 py-2 text-sm outline-none focus:border-mc-primary"

export const btnPrimaryCls =
  "border-2 border-mc-ink bg-mc-ink px-4 py-2 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-mc-surface transition hover:bg-mc-accent hover:border-mc-accent disabled:cursor-not-allowed disabled:opacity-30"

export const btnGhostCls =
  "border-2 border-mc-ink/30 px-4 py-2 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-mc-secondary hover:border-mc-ink hover:text-mc-ink"

"use client"

import { useEffect, useRef, useState } from "react"
import { HttpTypes } from "@medusajs/types"

import AccountDetailsForm from "@modules/account/components/account-settings/account-details-form"
import SecurityForm from "@modules/account/components/account-settings/security-form"

type Tab = "account" | "security"

type Props = {
  customer: HttpTypes.StoreCustomer
  hasPassword: boolean
}

const triggerClass =
  "inline-flex items-center justify-center gap-2 border-2 border-ink px-5 py-3 font-family-heading text-sm font-bold uppercase tracking-[0.08em] transition-all"

export default function MonsoonAccountSettingsModal({
  customer,
  hasPassword,
}: Props) {
  const [tab, setTab] = useState<Tab | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const open = tab !== null
  const close = () => setTab(null)

  // Scroll lock + escape key while open
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    window.addEventListener("keydown", onKey)
    requestAnimationFrame(() => dialogRef.current?.focus())
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={() => setTab("account")}
          className={`${triggerClass} border-ink bg-surface text-ink hover:bg-ink hover:text-surface`}
          data-testid="open-account-settings"
        >
          Account Settings →
        </button>
        <button
          type="button"
          onClick={() => setTab("security")}
          className={`${triggerClass} border-accent bg-accent text-surface hover:bg-ink hover:border-ink`}
          data-testid="open-security-settings"
        >
          Security Settings →
        </button>
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="account-settings-title"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/60 px-4 py-8 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close()
          }}
          data-testid="account-settings-modal"
        >
          <div
            ref={dialogRef}
            tabIndex={-1}
            className="flex max-h-[92vh] w-full max-w-xl flex-col border-2 border-ink bg-surface shadow-[6px_6px_0px_0px_var(--mc-ink)] focus:outline-none"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-4 border-b-2 border-ink bg-ink px-6 py-5">
              <div>
                <p className="font-family-heading text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--mc-primary)]">
                  Member Account
                </p>
                <h2
                  id="account-settings-title"
                  className="mt-1 font-family-heading text-2xl font-black uppercase tracking-tight text-surface sm:text-3xl"
                >
                  {tab === "account" ? "Account Settings" : "Security Settings"}
                </h2>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="grid h-10 w-10 place-items-center border-2 border-surface bg-ink text-surface transition-colors hover:bg-surface hover:text-ink"
                data-testid="close-account-settings"
              >
                <span className="font-family-heading text-xl leading-none">
                  ×
                </span>
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {tab === "account" ? (
                <AccountDetailsForm customer={customer} />
              ) : (
                <SecurityForm hasPassword={hasPassword} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

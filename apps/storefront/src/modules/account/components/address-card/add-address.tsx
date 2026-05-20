"use client"

import { Plus } from "@medusajs/icons"
import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useRouter } from "next/navigation"

import { addCustomerAddress } from "@lib/data/customer"
import useToggleState from "@lib/hooks/use-toggle-state"
import { HttpTypes } from "@medusajs/types"
import { useFormStatus } from "react-dom"

type AddAddressProps = {
  region: HttpTypes.StoreRegion
  addresses: HttpTypes.StoreCustomerAddress[]
  trigger?: {
    className?: string
    children?: ReactNode
    "data-testid"?: string
  }
}

type FormState = {
  success: boolean
  error: string | null
  isDefaultShipping?: boolean
  isDefaultBilling?: boolean
}

function Field({
  name,
  label,
  required,
  type = "text",
  autoComplete,
  inputMode,
  className = "",
  testId,
}: {
  name: string
  label: string
  required?: boolean
  type?: string
  autoComplete?: string
  inputMode?: "text" | "numeric" | "email" | "tel"
  className?: string
  testId?: string
}) {
  return (
    <label className={`grid gap-2 ${className}`}>
      <span className="font-family-heading text-xs font-bold uppercase tracking-[0.16em] text-ink/70">
        {label}
        {required && <span className="text-red-700"> *</span>}
      </span>
      <input
        type={type}
        name={name}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        data-testid={testId}
        className="h-12 border-2 border-ink bg-surface px-4 font-family-base text-ink placeholder:text-ink/30 focus:bg-surface focus:outline-none focus:ring-0"
      />
    </label>
  )
}

function CountryField({
  region,
  required,
}: {
  region: HttpTypes.StoreRegion
  required?: boolean
}) {
  const countries = useMemo(() => region.countries ?? [], [region])
  return (
    <label className="grid gap-2">
      <span className="font-family-heading text-xs font-bold uppercase tracking-[0.16em] text-ink/70">
        Country
        {required && <span className="text-red-700"> *</span>}
      </span>
      <select
        name="country_code"
        required={required}
        autoComplete="country"
        data-testid="country-select"
        className="h-12 border-2 border-ink bg-surface px-4 font-family-base text-ink focus:outline-none"
      >
        <option value="">Select a country…</option>
        {countries.map((c) => (
          <option key={c.iso_2} value={c.iso_2}>
            {c.display_name ?? c.name}
          </option>
        ))}
      </select>
    </label>
  )
}

function SaveBtn({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      data-testid="save-button"
      className="inline-flex items-center justify-center border-2 border-ink bg-ink px-6 py-3 font-family-heading text-sm font-bold uppercase tracking-[0.16em] text-surface transition-all hover:bg-accent hover:border-accent disabled:opacity-50 sm:w-auto"
    >
      {pending ? "Saving…" : children}
    </button>
  )
}

const AddAddress = ({ region, addresses, trigger }: AddAddressProps) => {
  const router = useRouter()
  const [successState, setSuccessState] = useState(false)
  const { state, open, close: closeModal } = useToggleState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  const hasNoAddresses = !addresses || addresses.length === 0
  const hasNoDefaultShipping = !addresses?.some((a) => a.is_default_shipping)
  const hasNoDefaultBilling = !addresses?.some((a) => a.is_default_billing)

  const [formState, formAction] = useActionState<FormState, FormData>(
    addCustomerAddress as unknown as (
      state: FormState,
      payload: FormData
    ) => Promise<FormState>,
    {
      success: false,
      error: null,
      isDefaultShipping: hasNoAddresses || hasNoDefaultShipping,
      isDefaultBilling: hasNoAddresses || hasNoDefaultBilling,
    }
  )

  const close = () => {
    setSuccessState(false)
    closeModal()
  }

  useEffect(() => {
    if (successState) close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successState])

  useEffect(() => {
    if (formState.success) {
      setSuccessState(true)
      router.refresh()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState])

  // Scroll lock + escape key
  useEffect(() => {
    if (!state) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    window.addEventListener("keydown", onKey)
    // focus the dialog so screen readers / keyboard land here
    requestAnimationFrame(() => dialogRef.current?.focus())

    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const defaultTriggerClass =
    "group relative flex h-full min-h-[220px] w-full flex-col items-center justify-center gap-3 border-2 border-dashed border-ink/40 bg-surface p-6 text-ink transition-all hover:border-ink hover:bg-ink/5 hover:shadow-[4px_4px_0px_0px_var(--mc-ink)]"

  return (
    <>
      <button
        type="button"
        className={trigger?.className ?? defaultTriggerClass}
        onClick={open}
        data-testid={trigger?.["data-testid"] ?? "add-address-button"}
      >
        {trigger?.children ?? (
          <>
            <span className="flex h-12 w-12 items-center justify-center border-2 border-ink bg-accent text-surface transition-transform group-hover:scale-105">
              <Plus />
            </span>
            <span className="font-family-heading text-base font-bold uppercase tracking-[0.1em] text-ink">
              New address
            </span>
          </>
        )}
      </button>

      {state && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-address-title"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/60 px-4 py-8 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close()
          }}
          data-testid="add-address-modal"
        >
          <div
            ref={dialogRef}
            tabIndex={-1}
            className="flex max-h-[92vh] w-full max-w-2xl flex-col border-2 border-ink bg-surface shadow-[6px_6px_0px_0px_var(--mc-ink)] focus:outline-none"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-4 border-b-2 border-ink bg-ink px-6 py-5">
              <div>
                <p className="font-family-heading text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--mc-primary)]">
                  Address Book
                </p>
                <h2
                  id="add-address-title"
                  className="mt-1 font-family-heading text-2xl sm:text-3xl font-black uppercase tracking-tight text-surface"
                >
                  New Address
                </h2>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="grid h-10 w-10 place-items-center border-2 border-surface bg-ink text-surface transition-colors hover:bg-surface hover:text-ink"
                data-testid="close-modal-button"
              >
                <span className="font-family-heading text-xl leading-none">
                  ×
                </span>
              </button>
            </header>

            <form action={formAction} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="flex flex-col gap-5">
                  <section className="flex flex-col gap-4">
                    <p className="font-family-heading text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
                      Recipient
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field
                        name="first_name"
                        label="First name"
                        required
                        autoComplete="given-name"
                        testId="first-name-input"
                      />
                      <Field
                        name="last_name"
                        label="Last name"
                        required
                        autoComplete="family-name"
                        testId="last-name-input"
                      />
                    </div>
                    <Field
                      name="company"
                      label="Company"
                      autoComplete="organization"
                      testId="company-input"
                    />
                  </section>

                  <section className="flex flex-col gap-4 border-t-2 border-ink/10 pt-5">
                    <p className="font-family-heading text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
                      Address
                    </p>
                    <Field
                      name="address_1"
                      label="Address line 1"
                      required
                      autoComplete="address-line1"
                      testId="address-1-input"
                    />
                    <Field
                      name="address_2"
                      label="Apartment, suite, etc."
                      autoComplete="address-line2"
                      testId="address-2-input"
                    />
                    <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
                      <Field
                        name="postal_code"
                        label="Postal code"
                        required
                        autoComplete="postal-code"
                        testId="postal-code-input"
                      />
                      <Field
                        name="city"
                        label="City"
                        required
                        autoComplete="address-level2"
                        testId="city-input"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field
                        name="province"
                        label="Province / State"
                        autoComplete="address-level1"
                        testId="state-input"
                      />
                      <CountryField region={region} required />
                    </div>
                    <Field
                      name="phone"
                      label="Phone"
                      type="tel"
                      autoComplete="tel"
                      inputMode="numeric"
                      testId="phone-input"
                    />
                  </section>

                  <section className="flex flex-col gap-3 border-2 border-ink/15 bg-ink/5 p-4">
                    <p className="font-family-heading text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
                      Defaults
                    </p>
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        name="is_default_shipping"
                        defaultChecked={hasNoAddresses || hasNoDefaultShipping}
                        className="mt-1 h-4 w-4 border-2 border-ink accent-accent"
                        data-testid="default-shipping-input"
                      />
                      <span className="font-family-heading text-xs font-bold uppercase tracking-[0.12em] text-ink">
                        Set as default shipping address
                      </span>
                    </label>
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        name="is_default_billing"
                        defaultChecked={hasNoAddresses || hasNoDefaultBilling}
                        className="mt-1 h-4 w-4 border-2 border-ink accent-accent"
                        data-testid="default-billing-input"
                      />
                      <span className="font-family-heading text-xs font-bold uppercase tracking-[0.12em] text-ink">
                        Set as default billing address
                      </span>
                    </label>
                  </section>

                  {formState.error && (
                    <div
                      className="border-2 border-red-700 bg-red-50 px-4 py-3 font-family-heading text-xs font-bold uppercase tracking-[0.12em] text-red-700"
                      data-testid="address-error"
                    >
                      {formState.error}
                    </div>
                  )}
                </div>
              </div>

              <footer className="flex flex-col-reverse gap-3 border-t-2 border-ink bg-surface px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={close}
                  className="inline-flex items-center justify-center border-2 border-ink bg-surface px-6 py-3 font-family-heading text-sm font-bold uppercase tracking-[0.16em] text-ink transition-all hover:bg-ink hover:text-surface"
                  data-testid="cancel-button"
                >
                  Cancel
                </button>
                <SaveBtn>Save address</SaveBtn>
              </footer>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default AddAddress

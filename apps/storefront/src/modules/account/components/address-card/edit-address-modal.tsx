"use client"

import {
  deleteCustomerAddress,
  updateCustomerAddress,
} from "@lib/data/customer"
import useToggleState from "@lib/hooks/use-toggle-state"
import { PencilSquare as Edit, Trash } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@modules/common/components/ui"
import Spinner from "@modules/common/icons/spinner"
import { useRouter } from "next/navigation"
import React, {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useFormStatus } from "react-dom"

type EditAddressProps = {
  region: HttpTypes.StoreRegion
  address: HttpTypes.StoreCustomerAddress
  isActive?: boolean
}

type FormState = {
  success: boolean
  error: string | null
  addressId?: string
}

function Field({
  name,
  label,
  required,
  defaultValue,
  type = "text",
  autoComplete,
  inputMode,
  className = "",
  testId,
  numericOnly,
}: {
  name: string
  label: string
  required?: boolean
  defaultValue?: string
  type?: string
  autoComplete?: string
  inputMode?: "text" | "numeric" | "email" | "tel"
  className?: string
  testId?: string
  numericOnly?: boolean
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
        defaultValue={defaultValue}
        data-testid={testId}
        onInput={
          numericOnly
            ? (e) => {
                const t = e.currentTarget
                t.value = t.value.replace(/\D/g, "")
              }
            : undefined
        }
        className="h-12 border-2 border-ink bg-surface px-4 font-family-base text-ink placeholder:text-ink/30 focus:outline-none focus:ring-0"
      />
    </label>
  )
}

function CountryField({
  region,
  defaultValue,
  required,
}: {
  region: HttpTypes.StoreRegion
  defaultValue?: string
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
        defaultValue={defaultValue}
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
      className="inline-flex items-center justify-center border-2 border-ink bg-ink px-6 py-3 font-family-heading text-sm font-bold uppercase tracking-[0.16em] text-surface transition-all hover:bg-accent hover:border-accent disabled:opacity-50"
    >
      {pending ? "Saving…" : children}
    </button>
  )
}

const EditAddress: React.FC<EditAddressProps> = ({
  region,
  address,
  isActive = false,
}) => {
  const router = useRouter()
  const [removing, setRemoving] = useState(false)
  const [successState, setSuccessState] = useState(false)
  const { state, open, close: closeModal } = useToggleState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  const [formState, formAction] = useActionState<FormState, FormData>(
    updateCustomerAddress as unknown as (
      state: FormState,
      payload: FormData
    ) => Promise<FormState>,
    {
      success: false,
      error: null,
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
    requestAnimationFrame(() => dialogRef.current?.focus())

    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const removeAddress = async () => {
    setRemoving(true)
    await deleteCustomerAddress(address.id)
    setRemoving(false)
    router.refresh()
  }

  const isDefaultShipping = !!address.is_default_shipping
  const isDefaultBilling = !!address.is_default_billing

  return (
    <>
      <div
        className={clx(
          "relative flex h-full min-h-[220px] w-full flex-col justify-between border-2 bg-surface p-6 transition-all",
          isActive
            ? "border-ink shadow-[4px_4px_0px_0px_var(--mc-ink)]"
            : "border-ink/30 hover:border-ink hover:shadow-[4px_4px_0px_0px_var(--mc-ink)]"
        )}
        data-testid="address-container"
      >
        <div className="flex flex-col">
          {(isDefaultShipping || isDefaultBilling) && (
            <div className="mb-3 flex flex-wrap gap-2">
              {isDefaultShipping && (
                <span className="inline-flex border-2 border-accent bg-accent/10 px-2 py-1 font-family-heading text-[10px] font-bold uppercase tracking-[0.08em] text-accent">
                  Default shipping
                </span>
              )}
              {isDefaultBilling && (
                <span className="inline-flex border-2 border-ink bg-ink/10 px-2 py-1 font-family-heading text-[10px] font-bold uppercase tracking-[0.08em] text-ink">
                  Default billing
                </span>
              )}
            </div>
          )}
          <h3
            className="text-left font-family-heading text-lg font-bold uppercase tracking-tight text-ink"
            data-testid="address-name"
          >
            {address.first_name} {address.last_name}
          </h3>
          {address.company && (
            <p
              className="font-family-base text-sm text-ink/65"
              data-testid="address-company"
            >
              {address.company}
            </p>
          )}
          <div className="mt-2 flex flex-col gap-y-0.5 text-left font-family-base text-sm text-ink/75">
            <span data-testid="address-address">
              {address.address_1}
              {address.address_2 && <span>, {address.address_2}</span>}
            </span>
            <span data-testid="address-postal-city">
              {address.postal_code}, {address.city}
            </span>
            <span data-testid="address-province-country">
              {address.province && `${address.province}, `}
              {address.country_code?.toUpperCase()}
            </span>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-x-4 border-t border-ink/15 pt-4">
          <button
            type="button"
            className="flex items-center gap-x-2 font-family-heading text-xs font-bold uppercase tracking-[0.08em] text-ink hover:text-accent"
            onClick={open}
            data-testid="address-edit-button"
          >
            <Edit />
            Edit
          </button>
          <button
            type="button"
            className="flex items-center gap-x-2 font-family-heading text-xs font-bold uppercase tracking-[0.08em] text-ink hover:text-red-700"
            onClick={removeAddress}
            data-testid="address-delete-button"
            disabled={removing}
          >
            {removing ? <Spinner /> : <Trash />}
            Remove
          </button>
        </div>
      </div>

      {state && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-address-title"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/60 px-4 py-8 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close()
          }}
          data-testid="edit-address-modal"
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
                  id="edit-address-title"
                  className="mt-1 font-family-heading text-2xl sm:text-3xl font-black uppercase tracking-tight text-surface"
                >
                  Edit Address
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
              <input type="hidden" name="addressId" value={address.id} />
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
                        defaultValue={address.first_name || undefined}
                        testId="first-name-input"
                      />
                      <Field
                        name="last_name"
                        label="Last name"
                        required
                        autoComplete="family-name"
                        defaultValue={address.last_name || undefined}
                        testId="last-name-input"
                      />
                    </div>
                    <Field
                      name="company"
                      label="Company"
                      autoComplete="organization"
                      defaultValue={address.company || undefined}
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
                      defaultValue={address.address_1 || undefined}
                      testId="address-1-input"
                    />
                    <Field
                      name="address_2"
                      label="Apartment, suite, etc."
                      autoComplete="address-line2"
                      defaultValue={address.address_2 || undefined}
                      testId="address-2-input"
                    />
                    <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
                      <Field
                        name="postal_code"
                        label="Postal code"
                        required
                        inputMode="numeric"
                        autoComplete="postal-code"
                        defaultValue={address.postal_code || undefined}
                        testId="postal-code-input"
                        numericOnly
                      />
                      <Field
                        name="city"
                        label="City"
                        required
                        autoComplete="address-level2"
                        defaultValue={address.city || undefined}
                        testId="city-input"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field
                        name="province"
                        label="Province / State"
                        autoComplete="address-level1"
                        defaultValue={address.province || undefined}
                        testId="state-input"
                      />
                      <CountryField
                        region={region}
                        required
                        defaultValue={address.country_code || undefined}
                      />
                    </div>
                    <Field
                      name="phone"
                      label="Phone"
                      type="tel"
                      autoComplete="tel"
                      inputMode="numeric"
                      defaultValue={address.phone || undefined}
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
                        defaultChecked={isDefaultShipping}
                        className="mt-1 h-4 w-4 border-2 border-ink accent-accent"
                        data-testid="default-shipping-input"
                      />
                      <span className="font-family-heading text-xs font-bold uppercase tracking-[0.12em] text-ink">
                        Default shipping address
                      </span>
                    </label>
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        name="is_default_billing"
                        defaultChecked={isDefaultBilling}
                        className="mt-1 h-4 w-4 border-2 border-ink accent-accent"
                        data-testid="default-billing-input"
                      />
                      <span className="font-family-heading text-xs font-bold uppercase tracking-[0.12em] text-ink">
                        Default billing address
                      </span>
                    </label>
                  </section>

                  {formState.error && (
                    <div className="border-2 border-red-700 bg-red-50 px-4 py-3 font-family-heading text-xs font-bold uppercase tracking-[0.12em] text-red-700">
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
                <SaveBtn>Save changes</SaveBtn>
              </footer>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default EditAddress

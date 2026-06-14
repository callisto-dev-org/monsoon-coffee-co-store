"use client"

import { useActionState, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

import {
  saveCheckoutAddress,
  type CheckoutFormState,
} from "@modules/checkout/actions"
import { OutlineButton } from "@modules/common/components/monsoon/buttons"

type Props = {
  cart: HttpTypes.StoreCart
  region: HttpTypes.StoreRegion
  customerEmail: string | null
  isAuthenticated?: boolean
  hasDefaultShipping?: boolean
  addresses?: HttpTypes.StoreCustomerAddress[]
  // Called after the address is saved successfully, so the parent can collapse
  // back to the summary view without waiting on a full reload.
  onSaved?: () => void
}

const initialState: CheckoutFormState = { errors: {}, message: null }

function Field({
  name,
  label,
  required,
  defaultValue,
  type = "text",
  inputMode,
  autoComplete,
  error,
  numericOnly,
}: {
  name: string
  label: string
  required?: boolean
  defaultValue?: string
  type?: string
  inputMode?: "text" | "numeric" | "email" | "tel"
  autoComplete?: string
  error?: string
  numericOnly?: boolean
}) {
  return (
    <label className="grid gap-2">
      <span className="font-family-heading text-xs font-bold uppercase tracking-widest text-ink/70">
        {label}
        {required && <span className="text-red-700"> *</span>}
      </span>
      <input
        type={type}
        name={name}
        inputMode={inputMode}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        required={required}
        onInput={
          numericOnly
            ? (e) => {
                const t = e.currentTarget
                t.value = t.value.replace(/\D/g, "")
              }
            : undefined
        }
        className={`h-12 w-full min-w-0 border-2 ${
          error ? "border-red-700" : "border-ink"
        } bg-surface px-4 font-family-base text-ink focus:outline-none`}
      />
      {error && (
        <span className="text-[10px] font-bold uppercase tracking-widest text-red-700">
          {error}
        </span>
      )}
    </label>
  )
}

const MANUAL = "__manual__"

const ADDRESS_KEYS = [
  "first_name",
  "last_name",
  "address_1",
  "address_2",
  "city",
  "province",
  "postal_code",
  "country_code",
  "phone",
] as const

// Two addresses are "the same" when every comparable field matches
// (case-insensitive, trimmed). Used to decide whether a saved cart already has a
// distinct shipping address that should re-open the shipping fieldset.
function addressesEqual(
  a?: HttpTypes.StoreCartAddress | null,
  b?: HttpTypes.StoreCartAddress | null
): boolean {
  if (!a || !b) return !a && !b
  const norm = (v: unknown) => String(v ?? "").trim().toLowerCase()
  return ADDRESS_KEYS.every(
    (k) =>
      norm((a as unknown as Record<string, unknown>)[k]) ===
      norm((b as unknown as Record<string, unknown>)[k])
  )
}

export default function MonsoonAddressForm({
  cart,
  region,
  customerEmail,
  isAuthenticated = false,
  hasDefaultShipping = false,
  addresses = [],
  onSaved,
}: Props) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(
    saveCheckoutAddress,
    initialState
  )

  // Primary fields are the billing address; the optional fieldset below is the
  // shipping address. Legacy carts may only carry a shipping address — fall back
  // to it so the billing fields still seed.
  const billing = cart.billing_address ?? cart.shipping_address ?? null
  const shipAddr = cart.shipping_address ?? null
  const billingDiffersFromShipping = !addressesEqual(billing, shipAddr)

  // Limit picker to addresses available in the cart's region
  const regionCountryCodes = useMemo(
    () =>
      new Set(
        (region.countries ?? [])
          .map((c) => c.iso_2?.toLowerCase())
          .filter((c): c is string => !!c)
      ),
    [region]
  )
  const pickableAddresses = useMemo(
    () =>
      addresses.filter(
        (a) =>
          a.country_code &&
          regionCountryCodes.has(a.country_code.toLowerCase())
      ),
    [addresses, regionCountryCodes]
  )

  const defaultAddress = useMemo(
    () =>
      pickableAddresses.find((a) => a.is_default_shipping) ??
      pickableAddresses[0] ??
      null,
    [pickableAddresses]
  )

  // What seeds the form's defaultValues. Priority:
  //   1. Cart's already-set billing address (so edits don't wipe progress)
  //   2. Customer's default shipping
  //   3. Empty / manual
  const initialSelectionId = useMemo(() => {
    if (billing?.address_1) {
      const match = pickableAddresses.find(
        (a) =>
          a.address_1?.trim().toLowerCase() ===
            billing.address_1?.trim().toLowerCase() &&
          a.postal_code?.trim().toLowerCase() ===
            billing.postal_code?.trim().toLowerCase()
      )
      return match?.id ?? MANUAL
    }
    return defaultAddress?.id ?? MANUAL
  }, [billing, pickableAddresses, defaultAddress])

  const [selectedId, setSelectedId] = useState<string>(initialSelectionId)

  // Whether the shipping address is the same as the billing address entered
  // above. When unchecked we reveal a separate shipping address fieldset.
  // Defaults open when the saved cart already has a distinct shipping address,
  // and re-opens on a server round-trip that returned distinct shipping values.
  const [shipSameAsBilling, setShipSameAsBilling] = useState(
    !billingDiffersFromShipping
  )
  useEffect(() => {
    if (state.shipValues) setShipSameAsBilling(false)
  }, [state.shipValues])

  // Resolve the seed address used to prefill the billing fields
  const seed = useMemo<HttpTypes.StoreCartAddress | null>(() => {
    if (selectedId !== MANUAL) {
      const a = pickableAddresses.find((x) => x.id === selectedId)
      if (a) return a as unknown as HttpTypes.StoreCartAddress
    }
    return billing
  }, [selectedId, pickableAddresses, billing])

  // Hidden default-shipping checkbox is forced ON for "no default yet" users,
  // but we surface the manual control too.
  const defaultSaveChecked = !hasDefaultShipping

  return (
    <form action={formAction} className="flex min-w-0 flex-col gap-5" noValidate>
      {pickableAddresses.length > 0 && (
        <div className="flex min-w-0 flex-col gap-3 border-2 border-ink/15 bg-ink/5 p-4">
          <p className="font-family-heading text-xs font-bold uppercase tracking-[0.16em] text-accent">
            Use a saved address
          </p>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="h-12 w-full min-w-0 max-w-full truncate border-2 border-ink bg-surface px-4 font-family-base text-ink focus:outline-none"
            data-testid="saved-address-select"
          >
            {pickableAddresses.map((a) => {
              const label = [
                a.is_default_shipping ? "★" : null,
                [a.first_name, a.last_name].filter(Boolean).join(" "),
                [a.address_1, a.city, a.postal_code]
                  .filter(Boolean)
                  .join(", "),
              ]
                .filter(Boolean)
                .join(" — ")
              return (
                <option key={a.id} value={a.id}>
                  {label}
                </option>
              )
            })}
            <option value={MANUAL}>Enter a new address…</option>
          </select>

          {selectedId !== MANUAL && seed && (
            <div className="mt-1 min-w-0 break-words border-2 border-ink bg-surface p-4 font-family-base text-sm text-ink/80">
              <p className="font-family-heading text-xs font-bold uppercase tracking-[0.12em] text-ink">
                {[seed.first_name, seed.last_name].filter(Boolean).join(" ")}
              </p>
              {seed.address_1 && <p className="mt-1">{seed.address_1}</p>}
              {seed.address_2 && <p>{seed.address_2}</p>}
              <p>
                {[seed.city, seed.province, seed.postal_code]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              <p className="uppercase">{seed.country_code}</p>
              {seed.phone && <p className="font-mono tabular-nums">{seed.phone}</p>}
            </div>
          )}
        </div>
      )}

      <p className="font-family-heading text-xs font-bold uppercase tracking-[0.16em] text-accent">
        Billing address
      </p>

      {/* Form fields are keyed on selection so defaultValues re-seed on switch */}
      <div className="flex flex-col gap-5" key={`form-${selectedId}`}>
        <Field
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          defaultValue={
            state.values?.email ?? cart.email ?? customerEmail ?? ""
          }
          error={state.errors.email}
          required
        />

        {selectedId !== MANUAL && seed ? (
          <>
            <input
              type="hidden"
              name="first_name"
              value={seed.first_name ?? ""}
            />
            <input
              type="hidden"
              name="last_name"
              value={seed.last_name ?? ""}
            />
            <input
              type="hidden"
              name="address_1"
              value={seed.address_1 ?? ""}
            />
            <input
              type="hidden"
              name="address_2"
              value={seed.address_2 ?? ""}
            />
            <input type="hidden" name="city" value={seed.city ?? ""} />
            <input
              type="hidden"
              name="province"
              value={seed.province ?? ""}
            />
            <input
              type="hidden"
              name="postal_code"
              value={seed.postal_code ?? ""}
            />
            <input
              type="hidden"
              name="country_code"
              value={(seed.country_code ?? "").toUpperCase()}
            />
            <input type="hidden" name="phone" value={seed.phone ?? ""} />
          </>
        ) : (
          <>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            name="first_name"
            label="First Name"
            autoComplete="given-name"
            defaultValue={state.values?.first_name ?? seed?.first_name ?? ""}
            error={state.errors.first_name}
            required
          />
          <Field
            name="last_name"
            label="Last Name"
            autoComplete="family-name"
            defaultValue={state.values?.last_name ?? seed?.last_name ?? ""}
            error={state.errors.last_name}
            required
          />
        </div>

        <Field
          name="address_1"
          label="Address Line 1"
          autoComplete="address-line1"
          defaultValue={state.values?.address_1 ?? seed?.address_1 ?? ""}
          error={state.errors.address_1}
          required
        />
        <Field
          name="address_2"
          label="Address Line 2"
          autoComplete="address-line2"
          defaultValue={state.values?.address_2 ?? seed?.address_2 ?? ""}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            name="city"
            label="City"
            autoComplete="address-level2"
            defaultValue={state.values?.city ?? seed?.city ?? ""}
            error={state.errors.city}
            required
          />
          <Field
            name="province"
            label="State / Province"
            autoComplete="address-level1"
            defaultValue={state.values?.province ?? seed?.province ?? ""}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            name="postal_code"
            label="Postal Code"
            inputMode="numeric"
            autoComplete="postal-code"
            defaultValue={state.values?.postal_code ?? seed?.postal_code ?? ""}
            error={state.errors.postal_code}
            required
            numericOnly
          />
          <label className="grid gap-2">
            <span className="font-family-heading text-xs font-bold uppercase tracking-widest text-ink/70">
              Country <span className="text-red-700">*</span>
            </span>
            <select
              name="country_code"
              required
              defaultValue={
                state.values?.country_code ??
                seed?.country_code ??
                region.countries?.[0]?.iso_2 ??
                ""
              }
              className={`h-12 w-full min-w-0 border-2 ${
                state.errors.country_code ? "border-red-700" : "border-ink"
              } bg-surface px-4 font-family-base text-ink focus:outline-none`}
            >
              {region.countries?.map((c) => (
                <option key={c.iso_2} value={c.iso_2?.toUpperCase()}>
                  {c.display_name ?? c.name}
                </option>
              ))}
            </select>
            {state.errors.country_code && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-red-700">
                {state.errors.country_code}
              </span>
            )}
          </label>
        </div>

        <Field
          name="phone"
          label="Phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          defaultValue={state.values?.phone ?? seed?.phone ?? ""}
          error={state.errors.phone}
          required
          numericOnly
        />
          </>
        )}
      </div>

      <label className="mt-1 flex items-start gap-2 font-family-heading text-[11px] font-bold uppercase leading-snug tracking-[0.14em] text-ink/70 sm:items-center sm:text-xs sm:tracking-widest">
        <input
          type="checkbox"
          name="ship_same_as_billing"
          checked={shipSameAsBilling}
          onChange={(e) => setShipSameAsBilling(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-accent sm:mt-0"
        />
        <span className="min-w-0">Shipping address same as billing</span>
      </label>

      {!shipSameAsBilling && (
        <div className="flex flex-col gap-5 border-2 border-ink/15 bg-ink/5 p-4">
          <p className="font-family-heading text-xs font-bold uppercase tracking-[0.16em] text-accent">
            Shipping address
          </p>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              name="ship_first_name"
              label="First Name"
              autoComplete="given-name"
              defaultValue={
                state.shipValues?.first_name ?? shipAddr?.first_name ?? ""
              }
              error={state.errors.ship_first_name}
              required
            />
            <Field
              name="ship_last_name"
              label="Last Name"
              autoComplete="family-name"
              defaultValue={
                state.shipValues?.last_name ?? shipAddr?.last_name ?? ""
              }
              error={state.errors.ship_last_name}
              required
            />
          </div>

          <Field
            name="ship_address_1"
            label="Address Line 1"
            autoComplete="address-line1"
            defaultValue={
              state.shipValues?.address_1 ?? shipAddr?.address_1 ?? ""
            }
            error={state.errors.ship_address_1}
            required
          />
          <Field
            name="ship_address_2"
            label="Address Line 2"
            autoComplete="address-line2"
            defaultValue={
              state.shipValues?.address_2 ?? shipAddr?.address_2 ?? ""
            }
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              name="ship_city"
              label="City"
              autoComplete="address-level2"
              defaultValue={state.shipValues?.city ?? shipAddr?.city ?? ""}
              error={state.errors.ship_city}
              required
            />
            <Field
              name="ship_province"
              label="State / Province"
              autoComplete="address-level1"
              defaultValue={
                state.shipValues?.province ?? shipAddr?.province ?? ""
              }
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              name="ship_postal_code"
              label="Postal Code"
              inputMode="numeric"
              autoComplete="postal-code"
              defaultValue={
                state.shipValues?.postal_code ?? shipAddr?.postal_code ?? ""
              }
              error={state.errors.ship_postal_code}
              required
              numericOnly
            />
            <label className="grid gap-2">
              <span className="font-family-heading text-xs font-bold uppercase tracking-widest text-ink/70">
                Country <span className="text-red-700">*</span>
              </span>
              <select
                name="ship_country_code"
                required
                defaultValue={
                  state.shipValues?.country_code ??
                  shipAddr?.country_code?.toUpperCase() ??
                  region.countries?.[0]?.iso_2 ??
                  ""
                }
                className={`h-12 w-full min-w-0 border-2 ${
                  state.errors.ship_country_code
                    ? "border-red-700"
                    : "border-ink"
                } bg-surface px-4 font-family-base text-ink focus:outline-none`}
              >
                {region.countries?.map((c) => (
                  <option key={c.iso_2} value={c.iso_2?.toUpperCase()}>
                    {c.display_name ?? c.name}
                  </option>
                ))}
              </select>
              {state.errors.ship_country_code && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-red-700">
                  {state.errors.ship_country_code}
                </span>
              )}
            </label>
          </div>

          <Field
            name="ship_phone"
            label="Phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            defaultValue={state.shipValues?.phone ?? shipAddr?.phone ?? ""}
            error={state.errors.ship_phone}
            required
            numericOnly
          />
        </div>
      )}

      {isAuthenticated && (
        <label className="flex items-start gap-2 font-family-heading text-[11px] font-bold uppercase leading-snug tracking-[0.14em] text-ink/70 sm:items-center sm:text-xs sm:tracking-widest">
          <input
            type="checkbox"
            name="save_as_default_shipping"
            defaultChecked={defaultSaveChecked}
            className="mt-0.5 h-4 w-4 shrink-0 accent-accent sm:mt-0"
            data-testid="save-as-default-shipping"
          />
          <span className="min-w-0">
            {hasDefaultShipping
              ? "Replace my default shipping address with this one"
              : "Save as my default shipping address"}
          </span>
        </label>
      )}

      {state.message && (
        <p className="text-xs font-bold uppercase tracking-widest text-red-700 font-family-heading">
          {state.message}
        </p>
      )}

      <OutlineButton
        type="submit"
        color="ink"
        className="mt-2 w-full px-5 py-3 font-family-heading text-xs font-bold uppercase tracking-[0.16em] text-ink hover:bg-ink hover:text-surface disabled:opacity-50 sm:w-auto sm:self-start sm:px-6 sm:text-sm sm:tracking-[0.18em]"
        disabled={isPending}
      >
        {isPending
          ? "Saving…"
          : selectedId !== MANUAL && seed
          ? "Use this address"
          : billing?.address_1
          ? "Update address"
          : "Save address"}
      </OutlineButton>

      <RefreshOnSuccess
        state={state}
        isPending={isPending}
        onRefresh={() => {
          // Collapse to the summary first (instant), then revalidate the cart
          // so the summary shows the freshly saved addresses.
          onSaved?.()
          router.refresh()
        }}
      />
    </form>
  )
}

function RefreshOnSuccess({
  state,
  isPending,
  onRefresh,
}: {
  state: CheckoutFormState
  isPending: boolean
  onRefresh: () => void
}) {
  useEffect(() => {
    if (
      !isPending &&
      state &&
      !state.message &&
      Object.keys(state.errors).length === 0 &&
      state.values
    ) {
      onRefresh()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, isPending])
  return null
}

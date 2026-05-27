"use client"

import { useState } from "react"
import { HttpTypes } from "@medusajs/types"

import MonsoonAddressForm from "@modules/checkout/components/monsoon-address-form"

type Props = {
  cart: HttpTypes.StoreCart
  region: HttpTypes.StoreRegion
  customer: HttpTypes.StoreCustomer | null
}

function AddressSummary({
  address,
  email,
}: {
  address: HttpTypes.StoreCartAddress
  email?: string | null
}) {
  return (
    <dl className="flex flex-col gap-3 font-family-base text-sm text-ink/80 sm:text-base">
      <div>
        <dt className="font-family-heading text-[10px] font-bold uppercase tracking-[0.18em] text-ink/45">
          Recipient
        </dt>
        <dd className="mt-1 font-family-heading font-bold uppercase text-ink">
          {[address.first_name, address.last_name].filter(Boolean).join(" ") ||
            "—"}
        </dd>
      </div>

      <div>
        <dt className="font-family-heading text-[10px] font-bold uppercase tracking-[0.18em] text-ink/45">
          Address
        </dt>
        <dd className="mt-1 break-words">
          <p>{address.address_1}</p>
          {address.address_2 && <p>{address.address_2}</p>}
          <p>
            {[address.city, address.province, address.postal_code]
              .filter(Boolean)
              .join(", ")}
          </p>
          <p className="font-mono text-xs uppercase tabular-nums tracking-[0.08em] text-ink/55">
            {address.country_code}
          </p>
        </dd>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {address.phone && (
          <div>
            <dt className="font-family-heading text-[10px] font-bold uppercase tracking-[0.18em] text-ink/45">
              Phone
            </dt>
            <dd className="mt-1 font-mono tabular-nums">{address.phone}</dd>
          </div>
        )}
        {email && (
          <div className="min-w-0">
            <dt className="font-family-heading text-[10px] font-bold uppercase tracking-[0.18em] text-ink/45">
              Email
            </dt>
            <dd className="mt-1 break-all">{email}</dd>
          </div>
        )}
      </div>
    </dl>
  )
}

export default function CheckoutAddressStep({
  cart,
  region,
  customer,
}: Props) {
  const ship = cart.shipping_address ?? null
  const hasAddress = !!ship?.address_1
  const [editing, setEditing] = useState(!hasAddress)

  // If user has no saved address, the form is the only thing to show.
  if (!hasAddress || editing) {
    return (
      <div className="flex flex-col gap-5">
        {hasAddress && (
          <div className="-mt-1 -mr-1 flex justify-end">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="font-family-heading text-[10px] font-bold uppercase tracking-[0.18em] text-ink/55 underline underline-offset-4 hover:text-ink"
            >
              ← Cancel
            </button>
          </div>
        )}
        <MonsoonAddressForm
          cart={cart}
          region={region}
          customerEmail={customer?.email ?? null}
          isAuthenticated={!!customer}
          hasDefaultShipping={
            !!customer?.addresses?.some((a) => a.is_default_shipping)
          }
          addresses={customer?.addresses ?? []}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3 sm:items-center">
        <p className="font-family-heading text-[10px] font-bold uppercase tracking-[0.22em] text-accent sm:text-xs">
          Delivering to
        </p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-2 border-2 border-ink bg-surface px-3 py-1.5 font-family-heading text-[10px] font-bold uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink hover:text-surface sm:text-[11px]"
        >
          <span aria-hidden>←</span>
          Edit
        </button>
      </div>

      <AddressSummary address={ship!} email={cart.email ?? null} />
    </div>
  )
}

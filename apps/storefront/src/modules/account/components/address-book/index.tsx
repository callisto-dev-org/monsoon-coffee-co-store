import React from "react"

import AddAddress from "../address-card/add-address"
import EditAddress from "../address-card/edit-address-modal"
import { HttpTypes } from "@medusajs/types"

type AddressBookProps = {
  customer: HttpTypes.StoreCustomer
  region: HttpTypes.StoreRegion
}

const AddressBook: React.FC<AddressBookProps> = ({ customer, region }) => {
  const addresses = customer.addresses ?? []

  // Order: default shipping → default billing → rest (newest first)
  const sorted = [...addresses].sort((a, b) => {
    if (a.is_default_shipping !== b.is_default_shipping) {
      return a.is_default_shipping ? -1 : 1
    }
    if (a.is_default_billing !== b.is_default_billing) {
      return a.is_default_billing ? -1 : 1
    }
    return (b.created_at ?? "") > (a.created_at ?? "") ? 1 : -1
  })

  return (
    <div className="w-full">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="font-family-heading text-2xl sm:text-3xl font-black uppercase text-ink">
          Your Addresses
        </h2>
        <p className="font-family-heading text-xs font-bold uppercase tracking-[0.12em] text-ink/45 sm:text-sm">
          {addresses.length} saved
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <AddAddress region={region} addresses={addresses} />
        {sorted.map((address) => (
          <EditAddress region={region} address={address} key={address.id} />
        ))}
      </div>
    </div>
  )
}

export default AddressBook

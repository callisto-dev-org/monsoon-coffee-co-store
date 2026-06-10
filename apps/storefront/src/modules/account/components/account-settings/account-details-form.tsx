"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

import { updateAccountProfile } from "@lib/data/account-settings"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { CTAButton } from "@modules/common/components/monsoon/buttons"
import { Field, Notice } from "./fields"

// Editable account details: name only. Email is read-only (it's the sign-in
// identifier) and phone lives on each address.
export default function AccountDetailsForm({
  customer,
}: {
  customer: HttpTypes.StoreCustomer
}) {
  const router = useRouter()
  const [firstName, setFirstName] = useState(customer.first_name ?? "")
  const [lastName, setLastName] = useState(customer.last_name ?? "")
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [saving, start] = useTransition()

  const save = () => {
    setMsg(null)
    start(async () => {
      const r = await updateAccountProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      })
      if (!r.ok) {
        setMsg({ ok: false, text: r.error ?? "Could not save." })
        return
      }
      setMsg({ ok: true, text: "Saved." })
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="First Name"
          value={firstName}
          onChange={setFirstName}
          autoComplete="given-name"
        />
        <Field
          label="Last Name"
          value={lastName}
          onChange={setLastName}
          autoComplete="family-name"
        />
      </div>

      <div>
        <Field
          label="Email (cannot be changed)"
          value={customer.email}
          disabled
        />
        <p className="mt-2 font-family-base text-xs text-ink/55">
          Your email is tied to how you sign in. Contact support to change it.
        </p>
      </div>

      <p className="font-family-base text-xs text-ink/55">
        Phone numbers are saved with each delivery address.{" "}
        <LocalizedClientLink
          href="/account/addresses"
          className="font-medium text-ink underline underline-offset-2 hover:text-accent"
        >
          Manage addresses
        </LocalizedClientLink>
        .
      </p>

      {msg && <Notice ok={msg.ok} message={msg.text} />}

      <CTAButton
        type="button"
        onClick={save}
        disabled={saving}
        className="w-full py-3 sm:w-auto sm:self-start sm:px-8"
      >
        {saving ? "Saving…" : "Save details"}
      </CTAButton>
    </div>
  )
}

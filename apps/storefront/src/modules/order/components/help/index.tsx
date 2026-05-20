import LocalizedClientLink from "@modules/common/components/localized-client-link"
import React from "react"

const Help = () => {
  return (
    <div>
      <h2 className="mb-4 font-family-heading text-xl sm:text-2xl font-black uppercase text-ink">
        Need help?
      </h2>
      <ul className="flex flex-col gap-y-2 font-family-base text-base text-ink/75">
        <li>
          <LocalizedClientLink
            href="/contact"
            className="inline-flex items-center gap-2 font-family-heading text-sm font-bold uppercase tracking-[0.08em] text-accent hover:underline"
          >
            Contact
          </LocalizedClientLink>
        </li>
        <li>
          <LocalizedClientLink
            href="/contact"
            className="inline-flex items-center gap-2 font-family-heading text-sm font-bold uppercase tracking-[0.08em] text-accent hover:underline"
          >
            Returns &amp; Exchanges
          </LocalizedClientLink>
        </li>
      </ul>
    </div>
  )
}

export default Help
import type { SVGProps } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

const SHOP_LINKS = [
  { label: "Shop All", href: "/store" },
  { label: "Your Cart", href: "/cart" },
  { label: "Account", href: "/account" },
]

const COMPANY_LINKS = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
]

const LEGAL_LINKS = [
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
  { label: "Terms of Service", href: "/terms-of-service" },
  { label: "Terms of Use", href: "/terms-of-use" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Shipping Policy", href: "/shipping-policy" },
  { label: "Refund Policy", href: "/refund-policy" },
]

const SOCIALS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/monsoon.coffee.co/",
    Icon: InstagramIcon,
  },
]

function FooterColumn({
  heading,
  links,
}: {
  heading: string
  links: { label: string; href: string }[]
}) {
  return (
    <div className="flex flex-col gap-4">
      <span className="font-family-heading text-xs font-bold uppercase tracking-[0.22em] text-accent">
        {heading}
      </span>
      <nav className="flex flex-col gap-2.5">
        {links.map(({ label, href }) => (
          <LocalizedClientLink
            key={href}
            href={href}
            className="w-fit font-family-base text-sm text-surface/70 transition-colors hover:text-surface"
          >
            {label}
          </LocalizedClientLink>
        ))}
      </nav>
    </div>
  )
}

export default function Footer() {
  return (
    <footer className="w-full border-t-4 border-accent bg-ink font-family-heading text-surface">
      <div className="mx-auto w-full max-w-7xl px-6 py-14 sm:px-8 sm:py-16 lg:px-12">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-10">
          {/* ───────── Brand ───────── */}
          <div className="flex flex-col gap-5">
            <LocalizedClientLink
              href="/"
              className="text-2xl font-black uppercase leading-[0.95] sm:text-3xl"
            >
              Monsoon <br /> Coffee Co.
            </LocalizedClientLink>
            <p className="max-w-xs font-family-base text-sm font-light leading-relaxed text-surface/65">
              Small-batch coffee, roasted with intent — dispatched within 48
              hours of the roast.
            </p>
            <span className="font-family-heading text-[11px] font-semibold uppercase tracking-[0.22em] text-surface/55">
              A{" "}
              <LocalizedClientLink
                href="/about"
                className="text-accent transition-colors hover:text-surface"
              >
                Pluvio Coffee Works
              </LocalizedClientLink>{" "}
              brand
            </span>
            <div className="mt-1 flex flex-wrap gap-3">
              {SOCIALS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid h-11 w-11 place-items-center border-2 border-surface/25 text-surface transition-colors hover:border-accent hover:bg-accent"
                >
                  <Icon className="h-[1.15rem] w-[1.15rem]" />
                </a>
              ))}
            </div>
          </div>

          {/* ───────── Link columns ───────── */}
          <FooterColumn heading="Shop" links={SHOP_LINKS} />
          <FooterColumn heading="Company" links={COMPANY_LINKS} />
          <FooterColumn heading="Legal" links={LEGAL_LINKS} />
        </div>
      </div>

      {/* ───────── Bottom bar ───────── */}
      <div className="border-t border-surface/15">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-6 py-6 text-xs uppercase tracking-[0.12em] text-surface/60 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <span>
           © Pluvio Coffee Works. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  )
}

/* ─────────────── Social icons ─────────────── */

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
    </svg>
  )
}


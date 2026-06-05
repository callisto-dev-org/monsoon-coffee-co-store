import type { SVGProps } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

const SHOP_LINKS = [
  { label: "Shop All", href: "/store" },
  { label: "Your Bag", href: "/cart" },
  { label: "Account", href: "/account" },
]

const COMPANY_LINKS = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
]

const LEGAL_LINKS = [
  { label: "Terms of Service", href: "/terms-of-service" },
  { label: "Terms of Use", href: "/terms-of-use" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Shipping Policy", href: "/shipping-policy" },
  { label: "Refund Policy", href: "/refund-policy" },
]

const SOCIALS = [
  {
    label: "Instagram",
    href: "https://instagram.com/monsooncoffee",
    Icon: InstagramIcon,
  },
  {
    label: "X / Twitter",
    href: "https://twitter.com/monsooncoffee",
    Icon: XIcon,
  },
  {
    label: "Facebook",
    href: "https://facebook.com/monsooncoffee",
    Icon: FacebookIcon,
  },
  {
    label: "YouTube",
    href: "https://youtube.com/@monsooncoffee",
    Icon: YouTubeIcon,
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
            © {new Date().getFullYear()} Pluvio Coffee Works · Monsoon Coffee
            Co. All rights reserved.
          </span>
          <span className="text-surface/45">
            Roasted in small batches at the Pluvio roastery.
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

function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M17.53 3H20.5l-6.47 7.39L21.75 21h-6.04l-4.73-6.18L5.56 21H2.59l6.92-7.9L2.25 3h6.2l4.27 5.65L17.53 3Zm-1.06 16.2h1.65L7.62 4.71H5.85L16.47 19.2Z" />
    </svg>
  )
}

function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5h1.65V3.6c-.29-.04-1.27-.12-2.41-.12-2.39 0-4.03 1.46-4.03 4.14v2.18H7.5V13h2.75v8h3.25Z" />
    </svg>
  )
}

function YouTubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.27 5 12 5 12 5s-6.27 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2 26.1 26.1 0 0 0 2 12a26.1 26.1 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.76 1.77C5.73 19 12 19 12 19s6.27 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77A26.1 26.1 0 0 0 22 12a26.1 26.1 0 0 0-.4-4.8ZM10 15V9l5.2 3-5.2 3Z" />
    </svg>
  )
}

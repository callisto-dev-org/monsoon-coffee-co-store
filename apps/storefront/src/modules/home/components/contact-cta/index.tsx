import { ArrowRightAlt } from "@modules/common/icons/monsoon/arrow"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Compact home-page band that points visitors to the dedicated /contact page.
export default function ContactCta() {
  return (
    <section className="w-full bg-ink px-5 py-14 font-family-heading text-surface sm:px-8 sm:py-16 lg:px-16 lg:py-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-10">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-accent sm:text-sm">
            Get In Touch
          </span>
          <h2 className="text-3xl font-extrabold uppercase leading-[0.92] sm:text-4xl lg:text-5xl">
            Questions? Let&apos;s Talk Coffee.
          </h2>
          <p className="max-w-md font-family-base text-base font-light text-surface/75">
            Wholesale, cupping invites, or directions to the roastery — reach the
            team or find us on the map.
          </p>
        </div>

        <LocalizedClientLink
          href="/contact"
          className="group inline-flex w-fit shrink-0 items-center gap-2 border-2 border-surface px-6 py-4 text-sm font-bold uppercase tracking-[0.18em] text-surface transition-colors hover:border-accent hover:bg-accent sm:text-base"
        >
          Contact Us
          <span className="text-2xl transition-transform group-hover:translate-x-1">
            <ArrowRightAlt />
          </span>
        </LocalizedClientLink>
      </div>
    </section>
  )
}

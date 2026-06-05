import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  CTAButton,
  OutlineButton,
} from "@modules/common/components/monsoon/buttons"

export default function Hero() {
  return (
    <section className="relative w-full overflow-hidden border-b border-ink px-5 py-14 sm:px-10 sm:py-20 lg:py-28">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center gap-5 sm:gap-8">
        <span className="text-center font-family-heading text-[11px] font-semibold uppercase tracking-[0.18em] text-accent sm:text-sm lg:text-lg">
          EST. 2026 <span className="font-semibold">·</span> Small Batch Roasting
        </span>
        <span className="flex flex-col leading-[0.9]">
          <span className="text-center font-family-heading text-[clamp(2.75rem,16vw,8rem)] font-bold uppercase tracking-wide text-ink">
            MONSOON
          </span>
          <span className="text-center font-family-heading text-[clamp(2.75rem,16vw,8rem)] font-bold uppercase tracking-wide text-accent">
            COFFEE CO.
          </span>
        </span>
        <span className="w-full max-w-3xl text-balance text-center font-family-base text-[15px] font-medium tracking-tight text-[var(--mc-secondary)] sm:text-lg lg:text-xl">
          Explore unique coffees from some of the most innovative and unique
          farms in India, roasted to bring out the best in each bean.
        </span>
        <span className="flex w-full flex-col gap-3 font-family-heading sm:w-auto sm:flex-row sm:gap-4">
          <LocalizedClientLink href="/store">
            <CTAButton className="w-full px-8 py-3 text-lg sm:w-auto sm:px-12 sm:py-4 sm:text-xl">
              Shop The Ledger
            </CTAButton>
          </LocalizedClientLink>
          <LocalizedClientLink href="/store">
            <OutlineButton
              className="w-full px-8 py-3 text-lg font-medium uppercase sm:w-auto sm:px-12 sm:py-4 sm:text-xl"
              color="ink"
            >
              Our Method
            </OutlineButton>
          </LocalizedClientLink>
        </span>
        <span className="pointer-events-none absolute bottom-6 right-6 hidden border-2 border-ink p-2 md:block lg:bottom-12 lg:right-12">
          <Image
            src="/monsoon/images/beans.png"
            alt="Beans"
            width={140}
            height={140}
            className="h-20 w-auto lg:h-28"
          />
        </span>
      </div>
    </section>
  )
}

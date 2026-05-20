import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  CTAButton,
  OutlineButton,
} from "@modules/common/components/monsoon/buttons"

export default function Hero() {
  return (
    <section className="relative w-full overflow-hidden border-b border-ink px-6 py-16 sm:px-10 sm:py-20 lg:py-28">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center gap-6 sm:gap-8">
        <span className="text-center font-family-heading text-xs font-semibold uppercase tracking-widest text-accent sm:text-sm lg:text-lg">
          EST. 2025 <span className="font-semibold">. </span>
          Small Batch Roasting
        </span>
        <span className="flex flex-col leading-[0.9]">
          <span className="text-center font-family-heading text-[clamp(2.6rem,16vw,8rem)] font-bold uppercase tracking-wide text-ink">
            THE RAW
          </span>
          <span className="text-center font-family-heading text-[clamp(2.6rem,16vw,8rem)] font-bold uppercase tracking-wide text-accent">
            ROAST.
          </span>
        </span>
        <span className="w-full max-w-3xl text-center font-family-base text-base font-medium tracking-tight text-[var(--mc-secondary)] sm:text-lg lg:text-xl">
          Our process is a ledger of heat, time, and obsession. We roast for
          clarity, not comfort. Unapologetic specialty coffee for those who
          demand <br /> more from their morning ritual.
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

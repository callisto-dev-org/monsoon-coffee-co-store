import Image from "next/image"
import { ArrowRightAlt } from "@modules/common/icons/monsoon/arrow"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function AboutSection() {
  return (
    <section className="flex w-full flex-col gap-px font-family-heading">
      {/* ───────── Top band: philosophy + heat curve / lab ─────────
          Height is driven by the text column; the image side stretches to
          match via items-stretch + h-full. No viewport-height coupling, so it
          stays consistent across every large screen. */}
      <div className="flex flex-col gap-px lg:grid lg:grid-cols-6 lg:items-stretch lg:gap-px">
        <div className="flex flex-col gap-5 bg-ink px-5 py-10 sm:gap-6 sm:px-8 sm:py-14 lg:col-span-2 lg:justify-center lg:gap-8 lg:px-12 lg:py-20">
          <span className="font-family-heading text-xs font-semibold uppercase tracking-[0.18em] text-accent sm:text-base lg:text-lg">
            ORIGIN & PHILOSOPHY
          </span>
          <span className="font-family-heading text-[clamp(1.875rem,8vw,2.75rem)] font-extrabold leading-[0.9] text-surface sm:text-4xl lg:text-5xl xl:text-6xl">
            METICULOUSLY <br /> SOURCED.
          </span>
          <div className="py-1 font-family-base text-base font-light text-surface/80 sm:py-4 sm:text-xl lg:text-xl xl:text-2xl">
            We are picky and adamant about the coffees we source. Our sourcing
            philosophy is built on direct relationships with farmers who are
            equally insistent on high quality standards.
          </div>
          <div className="flex w-full flex-col gap-6 border-t-[3px] border-surface pt-6 font-family-heading sm:flex-row sm:pt-8">
            <span className="flex w-full flex-col gap-2 uppercase text-surface sm:w-1/2">
              <span className="text-4xl font-semibold sm:text-5xl">100%</span>
              <span className="text-sm font-medium text-surface/70">
                Sustainably Sourced
              </span>
            </span>
            <span className="flex w-full flex-col gap-2 uppercase text-surface sm:w-1/2">
              <span className="text-4xl font-semibold sm:text-5xl">48HR</span>
              <span className="text-sm font-medium text-surface/70">
                Freshly Roasted
              </span>
            </span>
          </div>
        </div>

        {/* Right stack: heat-curve row + lab row, each taking half the band */}
        <div className="flex flex-col gap-px lg:col-span-4">
          <div className="flex w-full flex-col gap-px lg:flex-1 lg:flex-row">
            <div className="relative h-64 w-full sm:h-80 lg:h-auto lg:w-1/2">
              <Image
                src="/monsoon/images/about1.png"
                alt="About 1"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex w-full flex-col bg-accent p-6 sm:p-10 lg:w-1/2 lg:p-16 xl:p-20">
              <span className="mt-auto flex flex-col lg:ml-auto">
                <span className="font-family-heading text-[clamp(1.875rem,8vw,2.25rem)] font-semibold uppercase leading-[0.95] text-surface sm:text-4xl lg:text-5xl">
                  Precision <br /> Roasting
                </span>
                <span className="mt-3 w-full text-base font-light text-surface/80 sm:mt-4 sm:text-lg lg:w-4/5">
                  We roast in extremely small batches, allowing us to have full
                  control over the roast and quality. If a cup doesn&apos;t pass
                  our strict quality standards, we don&apos;t ship it out.
                </span>
              </span>
            </div>
          </div>

          <div className="bg-ink p-3 sm:p-6 lg:flex lg:flex-1 lg:items-center lg:justify-center">
            <div className="flex w-full flex-col bg-surface lg:h-full lg:flex-row">
              <span className="flex w-full flex-col justify-center gap-3 px-5 py-8 sm:gap-4 sm:px-8 sm:py-10 lg:w-1/2 lg:px-16 lg:py-12 xl:px-20">
                <span className="font-family-heading text-3xl font-semibold uppercase text-ink sm:text-4xl lg:text-5xl">
                  The Lab
                </span>
                <span className="w-full text-base font-light text-ink/80 sm:mt-2 sm:text-lg">
                  All our roast profiles are subjected to rigorous and
                  meticulous cupping, as well as testing on multiple brewing
                  methods. We want to make sure you find the right coffee for
                  your brewing style.
                </span>
              </span>
              <div className="relative h-56 w-full sm:h-80 lg:h-auto lg:w-1/2">
                <Image
                  src="/monsoon/images/about2.png"
                  alt="About 2"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ───────── Bottom band: craft image + precision copy ─────────
          Height driven by the copy column; the image stretches to match. */}
      <div className="flex flex-col gap-px lg:grid lg:grid-cols-6 lg:items-stretch lg:gap-px">
        <div className="relative h-64 sm:h-[26rem] lg:col-span-3 lg:h-auto lg:min-h-[28rem]">
          <Image
            src="/monsoon/images/about3.png"
            alt="About 3"
            fill
            className="object-cover"
          />
          <span className="absolute bottom-3 left-3 bg-accent p-3 font-family-heading text-3xl font-bold uppercase text-surface sm:bottom-6 sm:left-6 sm:p-6 sm:text-6xl lg:bottom-8 lg:left-8 lg:p-8 lg:text-7xl">
            CRAFT.
          </span>
        </div>
        <div className="flex flex-col justify-center gap-6 px-5 py-10 sm:gap-8 sm:px-8 sm:py-14 lg:col-span-3 lg:gap-12 lg:p-20 xl:gap-16 xl:p-28">
          <span className="font-family-heading text-sm font-semibold uppercase tracking-[0.18em] text-accent sm:text-lg lg:text-xl">
            Behind the machine
          </span>
          <span className="font-family-heading text-[clamp(2rem,9vw,2.5rem)] font-bold uppercase leading-[0.95] text-ink sm:text-5xl lg:text-6xl xl:text-7xl">
            OUR <br /> HARDWARE.
          </span>
          <span className="font-family-base text-base font-light text-[var(--mc-secondary)] sm:text-lg lg:text-xl">
            All our coffees are roasted on a state of the art Kaleido M10S
            Carbon Fiber IR roaster. This gives us immense control over the
            roast profile and ensures phenomenal batch-to-batch consistency.
          </span>
          <span className="font-family-heading text-xs font-semibold uppercase tracking-[0.22em] text-[var(--mc-secondary)] sm:text-sm">
            Operated by{" "}
            <LocalizedClientLink
              href="/about"
              className="text-accent underline-offset-4 transition-colors hover:underline"
            >
              Pluvio Coffee Works
            </LocalizedClientLink>
          </span>
          <LocalizedClientLink
            href="/about"
            className="group relative flex w-fit cursor-pointer items-center gap-2 font-family-heading text-base font-semibold uppercase text-ink sm:text-xl lg:text-2xl"
          >
            <span className="before:border-b-4 py-1 before:border-accent before:absolute before:w-full before:h-full before:scale-x-0 before:origin-left before:transition-all group-hover:before:scale-x-100 relative">
              ABOUT US
            </span>
            <span className="text-3xl transition-transform group-hover:translate-x-2 sm:text-4xl">
              <ArrowRightAlt />
            </span>
          </LocalizedClientLink>
        </div>
      </div>
    </section>
  )
}

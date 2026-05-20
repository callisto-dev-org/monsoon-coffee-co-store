import Image from "next/image"
import { ArrowRightAlt } from "@modules/common/icons/monsoon/arrow"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function AboutSection() {
  return (
    <section className="w-full font-family-heading flex flex-col gap-px lg:grid lg:h-[200vh] lg:grid-cols-6 lg:grid-rows-4">
      <div className="flex flex-col gap-6 bg-ink px-6 py-12 sm:px-8 sm:py-14 lg:col-span-2 lg:row-span-2 lg:justify-center lg:gap-8 lg:px-12 lg:py-20">
        <span className="text-sm font-family-heading font-semibold tracking-widest text-accent sm:text-base lg:text-lg">
          ORIGIN & PHILOSOPHY
        </span>
        <span className="text-5xl font-extrabold text-surface sm:text-6xl lg:text-8xl">
          SOURCED <br /> BY <br /> STORM.
        </span>
        <div className="py-2 text-lg font-light font-family-base text-surface/80 sm:py-4 sm:text-xl lg:text-2xl">
          We don&apos;t just buy beans. We hunt for the erratic, the bold, and
          the uncompromising. Our sourcing philosophy is built on direct
          relationships with farmers who embrace the chaos of the monsoon
          season.
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
      <div className="flex h-full w-full flex-col gap-px lg:col-span-4 lg:row-span-1 lg:flex-row">
        <div className="relative h-64 w-full sm:h-80 lg:h-full lg:w-1/2">
          <Image
            src="/monsoon/images/about1.png"
            alt="About 1"
            fill
            className="object-cover"
          />
        </div>
        <div className="flex w-full flex-col bg-accent p-8 sm:p-10 lg:p-20">
          <span className="mt-auto flex flex-col lg:ml-auto">
            <span className="text-3xl font-semibold uppercase text-surface sm:text-4xl lg:text-5xl">
              The Heat <br /> Curve
            </span>
            <span className="mt-4 w-full text-base font-light text-surface/80 sm:text-lg lg:w-4/5">
              Every roast is choreographed: development time, drum speed,
              airflow. Variables become rituals; rituals become flavor.
            </span>
          </span>
        </div>
      </div>
      <div className="bg-ink p-4 sm:p-6 lg:col-span-4 lg:row-span-1 lg:flex lg:items-center lg:justify-center">
        <div className="flex w-full flex-col bg-surface lg:h-3/4 lg:flex-row">
          <span className="flex w-full flex-col gap-4 px-6 py-8 sm:px-8 sm:py-10 lg:w-1/2 lg:px-20 lg:py-20">
            <span className="text-3xl font-semibold uppercase text-ink sm:text-4xl lg:text-5xl">
              The Lab
            </span>
            <span className="mt-2 w-full text-base font-light text-ink/80 sm:mt-4 sm:text-lg">
              Our lab is a sanctuary of precision and obsession. Here, we
              dissect every variable of the roasting process to unlock the full
              potential of each bean. Science meets art.
            </span>
          </span>
          <div className="relative h-64 w-full sm:h-80 lg:h-full lg:w-1/2">
            <Image
              src="/monsoon/images/about2.png"
              alt="About 2"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>
      <div className="relative h-72 sm:h-[26rem] lg:col-span-3 lg:row-span-2 lg:h-auto">
        <Image
          src="/monsoon/images/about3.png"
          alt="About 3"
          fill
          className="object-cover"
        />
        <span className="absolute bottom-4 left-4 bg-accent p-4 text-4xl font-bold font-family-heading uppercase text-surface sm:bottom-6 sm:left-6 sm:p-6 sm:text-6xl lg:bottom-8 lg:left-8 lg:p-8 lg:text-7xl">
          CRAFT.
        </span>
      </div>
      <div className="flex flex-col justify-center gap-8 px-6 py-12 sm:px-8 sm:py-14 lg:col-span-3 lg:row-span-2 lg:gap-16 lg:p-24 xl:p-40">
        <span className="text-base font-semibold uppercase tracking-widest text-accent sm:text-lg lg:text-xl">
          Behind the machine
        </span>
        <span className="text-4xl font-bold uppercase text-ink sm:text-5xl lg:text-7xl">
          THE PRECISION <br /> OF HEAT.
        </span>
        <span className="text-base font-light text-[var(--mc-secondary)] sm:text-lg lg:text-xl">
          Every batch is treated as a unique chemical, architectural project.
          We don&apos;t follow factory presets; we listen to the bean,
          monitoring moisture loss and first crack with religious intensity.
        </span>
        <LocalizedClientLink
          href="/store"
          className="group relative flex w-fit cursor-pointer items-center gap-2 text-lg font-semibold uppercase text-ink sm:text-xl lg:text-2xl"
        >
          <span className="before:border-b-4 py-1 before:border-accent before:absolute before:w-full before:h-full before:scale-x-0 before:origin-left before:transition-all group-hover:before:scale-x-100 relative">
            EXPLORE OUR ROASTERY
          </span>
          <span className="text-3xl transition-transform group-hover:translate-x-2 sm:text-4xl">
            <ArrowRightAlt />
          </span>
        </LocalizedClientLink>
      </div>
    </section>
  )
}

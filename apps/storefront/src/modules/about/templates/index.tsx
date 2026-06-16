import Image from "next/image"
import { ArrowRightAlt } from "@modules/common/icons/monsoon/arrow"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const VALUES = [
  {
    no: "01",
    title: "Direct Sourcing",
    body: "We build long-term relationships with farmers and co-ops, paying above market for lots that earn it. No anonymous brokers, no factory presets.",
  },
  {
    no: "02",
    title: "Roasted To Order",
    body: "Beans ship within 48 hours of the roast. Freshness isn't a tagline here — it's the whole point. You taste the difference in the first cup.",
  },
  {
    no: "03",
    title: "Obsessive Precision",
    body: "Development time, drum speed, airflow, first crack — every variable is logged and dialed. We treat each batch as its own architectural project.",
  },
]

const STATS = [
  { value: "100%", label: "Sustainably Sourced" },
  { value: "48HR", label: "Freshly Roasted" },
  { value: "12+", label: "Origin Partners" },
  { value: "2026", label: "Roasting Since" },
]

export default function AboutTemplate() {
  return (
    <div className="w-full font-family-heading">
      {/* ───────── Hero ───────── */}
      <section className="border-b-4 border-ink bg-ink px-5 py-16 text-surface sm:px-8 sm:py-24 lg:px-16 lg:py-32">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:gap-10">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-accent sm:text-sm">
            Our Story
          </span>
          <h1 className="text-[clamp(2.75rem,12vw,7rem)] font-extrabold uppercase leading-[0.88]">
            Coffee, <br /> Roasted With Intent.
          </h1>
          <p className="max-w-2xl font-family-base text-lg font-light text-surface/80 sm:text-xl lg:text-2xl">
            Monsoon Coffee Co. is a small-batch roastery built on a single
            conviction: extraordinary coffee comes from obsessing over every
            variable — not chasing convenience.
          </p>
        </div>
      </section>

      {/* ───────── Origin story ───────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2">
        <div className="relative h-72 w-full sm:h-96 lg:h-auto lg:min-h-[34rem]">
          <Image
            src="/monsoon/images/about1.png"
            alt="Inside the roastery"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col justify-center gap-6 bg-surface px-5 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-24">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-accent sm:text-sm">
            How It Started
          </span>
          <h2 className="text-3xl font-bold uppercase leading-[0.95] text-ink sm:text-4xl lg:text-5xl">
            From A Single <br /> Drum Roaster.
          </h2>
          <div className="flex flex-col gap-4 font-family-base text-base font-light leading-relaxed text-ink/75 sm:text-lg">
            <p>
              We started in 2026 with one small drum roaster and a stubborn
              refusal to compromise. Every morning is a study in heat, time, and
              the temperament of a bean.
            </p>
            <p>
              We&apos;re young, and that&apos;s the point — small enough to cup
              every lot, log every curve, and obsess over each batch as if it
              were our first. A roast should sound as deliberate as it tastes.
            </p>
          </div>
        </div>
      </section>

      {/* ───────── Values ───────── */}
      <section className="border-y-4 border-ink bg-surface px-5 py-16 sm:px-8 sm:py-20 lg:px-16 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-accent sm:text-sm">
            What We Stand For
          </span>
          <h2 className="mt-4 max-w-3xl text-3xl font-bold uppercase leading-[0.95] text-ink sm:text-5xl lg:text-6xl">
            Three Things We <br /> Refuse To Cut.
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-px border-4 border-ink bg-ink sm:grid-cols-2 lg:mt-16 lg:grid-cols-3">
            {VALUES.map((v) => (
              <div
                key={v.no}
                className="flex flex-col gap-4 bg-surface p-7 sm:p-10"
              >
                <span className="font-family-base text-5xl font-black text-accent sm:text-6xl">
                  {v.no}
                </span>
                <h3 className="text-xl font-bold uppercase text-ink sm:text-2xl">
                  {v.title}
                </h3>
                <p className="font-family-base text-base font-light leading-relaxed text-ink/70">
                  {v.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Stats band ───────── */}
      <section className="bg-accent px-5 py-12 sm:px-8 sm:py-16 lg:px-16 lg:py-20">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col gap-2 text-surface">
              <span className="text-4xl font-extrabold sm:text-5xl lg:text-6xl">
                {s.value}
              </span>
              <span className="font-family-base text-xs font-medium uppercase tracking-[0.14em] text-surface/80 sm:text-sm">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── Craft / closing ───────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2">
        <div className="flex flex-col justify-center gap-6 bg-surface px-5 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-24">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-accent sm:text-sm">
            The Promise
          </span>
          <h2 className="text-3xl font-bold uppercase leading-[0.95] text-ink sm:text-4xl lg:text-5xl">
            Every Bag Is <br /> Accountable.
          </h2>
          <p className="font-family-base text-base font-light leading-relaxed text-ink/75 sm:text-lg">
            We don&apos;t hide behind blends or vague tasting notes. You get the
            origin, the process, and the roast date — because coffee this good
            has nothing to apologise for.
          </p>
          <LocalizedClientLink
            href="/store"
            className="group relative mt-2 flex w-fit cursor-pointer items-center gap-2 text-base font-semibold uppercase text-ink sm:text-xl"
          >
            <span className="relative py-1 before:absolute before:h-full before:w-full before:origin-left before:scale-x-0 before:border-b-4 before:border-accent before:transition-all group-hover:before:scale-x-100">
              Explore The Catalogue
            </span>
            <span className="text-3xl transition-transform group-hover:translate-x-2 sm:text-4xl">
              <ArrowRightAlt />
            </span>
          </LocalizedClientLink>
        </div>
        <div className="relative h-72 w-full sm:h-96 lg:h-auto lg:min-h-[30rem]">
          <Image
            src="/monsoon/images/about3.png"
            alt="Freshly roasted coffee"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
          <span className="absolute bottom-4 left-4 bg-ink p-3 text-2xl font-bold uppercase text-surface sm:bottom-6 sm:left-6 sm:p-5 sm:text-4xl lg:text-5xl">
            Craft.
          </span>
        </div>
      </section>
    </div>
  )
}

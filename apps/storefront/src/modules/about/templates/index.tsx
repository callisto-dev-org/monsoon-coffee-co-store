import Image from "next/image"
import { ArrowRightAlt } from "@modules/common/icons/monsoon/arrow"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const VALUES = [
  {
    no: "01",
    title: "Direct Sourcing",
    body: "We build long-term relationships with farmers and co-ops, paying above market for lots that earn it.",
  },
  {
    no: "02",
    title: "Roasted To Order",
    body: "We roast to order. All beans are shipped within 48hrs of roasting them.",
  },
  {
    no: "03",
    title: "Obsessive Precision",
    body: "Development time, drum speed, airflow, first crack. We use modern roasting software and logging to ensure consistency across each batch.",
  },
]

const STATS = [
  { value: "100%", label: "Sustainably Sourced" },
  { value: "48HR", label: "Freshly Roasted" },
  { value: "12+", label: "Origin Partners" },
  { value: "2026", label: "Roasting Since" },
]

const CLIENTS = [
  {
    no: "01",
    name: "Vinyl And Brew",
    location: "Alwarpet, Chennai",
    body: "A specialty coffee shop and audiophile haven in Alwarpet. Pairing the warm, analog sound of vintage vinyl with meticulously crafted specialty roasts, it offers a relaxed escape from the city's hustle — the perfect neighbourhood hub for music lovers and coffee enthusiasts alike.",
  },
  {
    no: "02",
    name: "Miraj Cafe",
    location: "Anna Nagar, Chennai",
    body: "A vibrant, contemporary hangout in the heart of Anna Nagar. Blending artisanal coffee and specialty brews with global comfort food, it offers an energetic yet cozy vibe — perfect for a morning caffeine fix, slow weekend brunches, or catching up with friends over a great cup.",
  },
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
            variable.
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
              We started in 2026 with one goal. To showcase the true beauty of
              Indian coffee through careful sourcing and meticulous roasting.
            </p>
            <p>
              We roast in small batches and ensure every cup passes our rigorous
              quality checks. We are constantly learning through every roast and
              improving our method.
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

      {/* ───────── Clients ───────── */}
      <section className="relative overflow-hidden border-t-4 border-ink bg-ink px-5 py-16 text-surface sm:px-8 sm:py-20 lg:px-16 lg:py-28">
        {/* oversized watermark */}
        <span className="pointer-events-none absolute -right-3 -top-4 select-none text-[3.5rem] font-black uppercase leading-none text-surface/[0.04] xsmall:text-[5rem] sm:-top-6 sm:text-[8rem] lg:-top-10 lg:text-[15rem]">
          Partners
        </span>

        <div className="relative mx-auto max-w-6xl">
          <div className="border-b border-surface/15 pb-6 sm:pb-8">
            <h2 className="max-w-3xl text-[clamp(1.75rem,8vw,3rem)] font-bold uppercase leading-[0.95] sm:text-5xl lg:text-6xl">
              The Cafes Pouring <br /> Our Coffee.
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 sm:gap-5 lg:mt-14 lg:grid-cols-2">
            {CLIENTS.map((c) => (
              <article
                key={c.name}
                className="group relative flex flex-col gap-5 overflow-hidden border border-surface/15 bg-surface/[0.03] p-6 transition-colors duration-300 hover:border-accent sm:gap-6 sm:p-10"
              >
                {/* accent sweep on hover */}
                <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-accent transition-transform duration-500 group-hover:scale-x-100" />

                <span className="font-family-base text-4xl font-black leading-none text-accent sm:text-6xl">
                  {c.no}
                </span>

                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-bold uppercase leading-tight transition-colors group-hover:text-accent sm:text-3xl">
                    {c.name}
                  </h3>
                  <span className="flex items-center gap-2 font-family-base text-[0.7rem] font-medium uppercase tracking-[0.16em] text-surface/55 sm:text-sm">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-3.5 w-3.5 shrink-0 text-accent"
                      aria-hidden="true"
                    >
                      <path
                        d="M12 21s7-5.686 7-11a7 7 0 10-14 0c0 5.314 7 11 7 11z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                      <circle cx="12" cy="10" r="2.5" fill="currentColor" />
                    </svg>
                    {c.location}
                  </span>
                </div>

                <p className="font-family-base text-sm font-light leading-relaxed text-surface/70 sm:text-base">
                  {c.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Craft / closing ───────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2">
        <div className="flex flex-col justify-center gap-6 bg-surface px-5 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-24">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-accent sm:text-sm">
            The Promise
          </span>
          <h2 className="text-3xl font-bold uppercase leading-[0.95] text-ink sm:text-4xl lg:text-5xl">
            Great coffee with <br /> every bag.
          </h2>
          <p className="font-family-base text-base font-light leading-relaxed text-ink/75 sm:text-lg">
            We want you to get the best value for your money. You shouldn&apos;t
            have to pay exorbitant sums for good, consistent coffee.
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

export default function MonsoonProductCarousel({
  items = [],
}: {
  items?: string[]
}) {
  const base = items.map((t) => t?.trim()).filter(Boolean) as string[]

  // No text → no carousel.
  if (base.length === 0) return null

  // The CSS loop translates the track by -50%, so ONE "set" must be wide enough
  // to cover the viewport or the marquee shows gaps. Inputs are arbitrary (one
  // long subtitle phrase, a couple of short words, or many) — so we repeat the
  // items until the set is comfortably wide, then duplicate it for the seamless
  // loop. Makes the carousel work for any text.
  const MIN_CHIPS = 12
  const set: string[] = []
  while (set.length < MIN_CHIPS) set.push(...base)
  const looped = [...set, ...set]
  return (
    <section className="w-full overflow-hidden border-y-4 border-ink bg-muted py-10">
      <div className="relative">
        <div
          className="flex w-max items-center gap-24 whitespace-nowrap pr-24 text-4xl font-bold tracking-tight text-surface/40 font-family-heading md:text-5xl"
          style={{ animation: "product-carousel-scroll 22s linear infinite" }}
          aria-label="Product highlights carousel"
        >
          {looped.map((item, index) => (
            <span key={`${item}-${index}`}>{item}</span>
          ))}
        </div>
      </div>
    </section>
  )
}

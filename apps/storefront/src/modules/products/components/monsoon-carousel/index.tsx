export default function MonsoonProductCarousel({
  items = ["FRESHLY ROASTED", "SMALL BATCH", "DIRECT TRADE", "MONSOON BLEND"],
}: {
  items?: string[]
}) {
  const looped = [...items, ...items]
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

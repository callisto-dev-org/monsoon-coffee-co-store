import { HighlightCard } from "@modules/common/components/monsoon/highlight-card"

export default function Loading() {
  return (
    <main className="flex flex-col items-center justify-center">
      <div className="mx-auto grid w-full max-w-7xl animate-pulse grid-cols-1 gap-8 px-6 py-12 font-family-heading lg:grid-cols-12 lg:gap-12 lg:py-20">
        {/* Thumbnail rail */}
        <div className="order-2 col-span-12 flex flex-row gap-4 lg:order-1 lg:col-span-1 lg:flex-col">
          {[0, 1, 2].map((i) => (
            <span key={i} className="aspect-square w-20 shrink-0 border-2 border-ink/15 bg-ink/5" />
          ))}
        </div>

        {/* Main image */}
        <div className="order-1 col-span-12 lg:order-2 lg:col-span-5">
          <HighlightCard size="lg" className="overflow-hidden">
            <div className="aspect-square w-full bg-ink/10" />
          </HighlightCard>
        </div>

        {/* Info column */}
        <div className="order-3 col-span-12 flex flex-col gap-5 lg:col-span-6">
          <span className="h-3 w-24 bg-accent/30" />
          <span className="h-9 w-4/5 bg-ink/10 sm:h-12" />
          <span className="h-7 w-1/3 bg-ink/15" />

          {/* Spec grid */}
          <div className="mt-2 grid grid-cols-3 border-2 border-ink/10">
            {[0, 1, 2].map((i) => (
              <span key={i} className="flex flex-col gap-2 border-r-2 border-ink/10 p-4 last:border-r-0">
                <span className="h-3 w-10 bg-ink/10" />
                <span className="h-5 w-16 bg-ink/10" />
              </span>
            ))}
          </div>

          {/* Option pills */}
          <div className="mt-2 flex flex-wrap gap-2">
            {[14, 20, 16].map((w, i) => (
              <span key={i} className="h-10 border-2 border-ink/10 bg-ink/5" style={{ width: `${w * 4}px` }} />
            ))}
          </div>

          {/* Quantity + CTA */}
          <div className="mt-2 flex flex-col gap-3">
            <span className="h-12 w-40 border-2 border-ink/10 bg-ink/5" />
            <span className="h-14 w-full bg-ink/10" />
          </div>
        </div>
      </div>

      {/* Highlight strip */}
      <div className="h-16 w-full bg-ink/90" />
    </main>
  )
}

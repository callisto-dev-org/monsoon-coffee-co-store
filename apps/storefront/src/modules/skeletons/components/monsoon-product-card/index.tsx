import { HighlightCard } from "@modules/common/components/monsoon/highlight-card"

/**
 * Loading placeholder that mirrors <MonsoonProductCard /> — same HighlightCard
 * frame, image aspect ratio, eyebrow / title / price stack, and CTA bar — so
 * the grid doesn't shift when the real cards stream in.
 */
export default function MonsoonProductCardSkeleton() {
  return (
    <article className="flex h-full w-full min-w-0 animate-pulse flex-col gap-3 font-family-heading sm:gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:gap-5">
        <HighlightCard size="sm" className="overflow-hidden">
          <div className="aspect-[275/346] w-full bg-ink/10" />
        </HighlightCard>
        <span className="flex min-w-0 flex-1 flex-col gap-2 py-1">
          <span className="h-3 w-1/3 bg-accent/30" />
          <span className="h-5 w-4/5 bg-ink/10 sm:h-6" />
          <span className="h-5 w-3/5 bg-ink/10 sm:h-6" />
          <span className="mt-1 h-5 w-1/4 bg-ink/15 sm:h-6" />
          <span className="hidden h-12 w-full bg-ink/5 sm:block" />
        </span>
      </div>
      <div className="mt-auto h-11 w-full shrink-0 bg-ink/10 sm:h-12" />
    </article>
  )
}

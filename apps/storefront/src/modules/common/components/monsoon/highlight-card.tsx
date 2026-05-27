import type { HTMLAttributes } from "react"

export type HighlightCardSize = "sm" | "md" | "lg"

// Shadow + border weight ladders. Each size also steps up with the viewport
// so a card never feels too heavy on a phone or too thin on a large screen.
const SIZE_STYLES: Record<
  HighlightCardSize,
  { shadow: string; border: string }
> = {
  sm: {
    // Small tiles (e.g. 2-up store cards on phones).
    shadow:
      "shadow-[3px_3px_var(--mc-ink)] sm:shadow-[5px_5px_var(--mc-ink)] lg:shadow-[8px_8px_var(--mc-ink)]",
    border: "border-2",
  },
  md: {
    // Default — medium tiles (featured cards, mid-size callouts).
    shadow:
      "shadow-[5px_5px_var(--mc-ink)] sm:shadow-[8px_8px_var(--mc-ink)] lg:shadow-[12px_12px_var(--mc-ink)]",
    border: "border-2 sm:border-4",
  },
  lg: {
    // Hero tiles (e.g. product detail image).
    shadow:
      "shadow-[8px_8px_var(--mc-ink)] sm:shadow-[12px_12px_var(--mc-ink)] lg:shadow-[16px_16px_var(--mc-ink)]",
    border: "border-4",
  },
}

export function HighlightCard({
  size = "md",
  className = "",
  ...divProps
}: HTMLAttributes<HTMLDivElement> & {
  size?: HighlightCardSize
}) {
  const { shadow, border } = SIZE_STYLES[size]
  return (
    <div
      {...divProps}
      className={`${shadow} ${border} border-ink ${className}`}
    />
  )
}

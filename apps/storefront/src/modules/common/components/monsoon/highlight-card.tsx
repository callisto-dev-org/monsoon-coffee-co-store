import type { HTMLAttributes } from "react"

export function HighlightCard({
  className = "",
  ...divProps
}: HTMLAttributes<HTMLDivElement> & {
  shadowBG?: string
  shadowTranslate?: string
}) {
  return (
    <div
      {...divProps}
      className={`shadow-[12px_12px_var(--mc-ink)] border-4 border-ink ${className}`}
    />
  )
}

type MonsoonLoaderProps = {
  /** Caption under the spinner. Pass an empty string to hide it. */
  label?: string
  /** Fill the viewport (centered) instead of sitting inline in the flow. */
  fullScreen?: boolean
  /** Diameter of the spinner in pixels. */
  size?: number
  className?: string
}

/**
 * Monsoon's branded loading indicator — two counter-rotating arcs (ink + accent)
 * around a pulsing centre, with an animated caption. Pure CSS, so it works in
 * both server and client components and as a `next/dynamic` loading fallback.
 */
export default function MonsoonLoader({
  label = "Brewing",
  fullScreen = false,
  size = 48,
  className = "",
}: MonsoonLoaderProps) {
  const spinner = (
    <div className="flex flex-col items-center gap-4 font-family-heading">
      <span
        className="relative inline-flex shrink-0"
        style={{ width: size, height: size }}
        role="status"
        aria-label={label || "Loading"}
      >
        <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-ink/15 border-t-accent" />
        <span className="absolute inset-[6px] animate-spin rounded-full border-[3px] border-ink/10 border-b-ink [animation-direction:reverse] [animation-duration:1.1s]" />
        <span className="absolute inset-0 m-auto h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
      </span>
      {label && (
        <span className="flex items-center text-xs font-bold uppercase tracking-[0.22em] text-ink/70">
          {label}
          <span aria-hidden className="ml-0.5 inline-flex">
            <span className="animate-bounce [animation-delay:-0.3s]">.</span>
            <span className="animate-bounce [animation-delay:-0.15s]">.</span>
            <span className="animate-bounce">.</span>
          </span>
        </span>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center bg-surface">
        {spinner}
      </div>
    )
  }

  return (
    <div className={`flex w-full items-center justify-center py-16 ${className}`}>
      {spinner}
    </div>
  )
}

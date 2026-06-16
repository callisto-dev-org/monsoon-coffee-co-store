import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  CTAButton,
  OutlineButton,
} from "@modules/common/components/monsoon/buttons"

// A single clip plays behind the hero copy. It autoplays muted + looped (the
// only way browsers allow unprompted playback) so no client JS is needed. A
// dark scrim sits on top to keep the headline + buttons legible regardless of
// how bright the footage is.
const HERO_VIDEO = "/monsoon/videos/hero-1.mp4"

export default function Hero() {
  return (
    <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden border-b border-ink bg-ink px-5 pb-20 pt-28 sm:px-10 sm:pb-24 sm:pt-32">
      {/* Video background. On wide (above-tablet) screens the portrait clip is
          anchored to its bottom so the lower part of the frame stays in view. */}
      <video
        className="absolute inset-0 h-full w-full object-cover object-center lg:object-[75%_65%]"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      >
        <source src={HERO_VIDEO} type="video/mp4" />
      </video>

      {/* Scrim: flat darken + a bottom-weighted gradient for text contrast. */}
      <div
        className="absolute inset-0 bg-ink/65 bg-gradient-to-b from-ink/50 via-ink/45 to-ink/85"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center justify-center gap-5 sm:gap-8">
        <span className="text-center font-family-heading text-[11px] font-semibold uppercase tracking-[0.18em] text-accent sm:text-sm lg:text-lg">
          EST. 2026 <span className="font-semibold">·</span> Small Batch Roasting
        </span>
        <span className="flex flex-col leading-[0.9] drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)]">
          <span className="text-center font-family-heading text-[clamp(2.75rem,16vw,8rem)] font-bold uppercase tracking-wide text-surface">
            MONSOON
          </span>
          <span className="text-center font-family-heading text-[clamp(2.75rem,16vw,8rem)] font-bold uppercase tracking-wide text-accent">
            COFFEE CO.
          </span>
        </span>
        <span className="w-full max-w-3xl text-balance text-center font-family-base text-[15px] font-medium tracking-tight text-surface/85 drop-shadow-[0_1px_8px_rgba(0,0,0,0.6)] sm:text-lg lg:text-xl">
          Explore unique coffees from some of the most innovative and unique
          farms in India, roasted to bring out the best in each bean.
        </span>
        <span className="flex w-full flex-col gap-3 font-family-heading sm:w-auto sm:flex-row sm:gap-4">
          <LocalizedClientLink href="/store">
            <CTAButton className="w-full px-8 py-3 text-lg sm:w-auto sm:px-12 sm:py-4 sm:text-xl">
              Shop The Stash
            </CTAButton>
          </LocalizedClientLink>
          <LocalizedClientLink href="/about">
            <OutlineButton
              className="w-full bg-surface/5 px-8 py-3 text-lg font-medium uppercase text-surface backdrop-blur-sm transition-colors hover:bg-surface hover:text-ink sm:w-auto sm:px-12 sm:py-4 sm:text-xl"
              color="surface"
            >
              About Us
            </OutlineButton>
          </LocalizedClientLink>
        </span>
      </div>
    </section>
  )
}

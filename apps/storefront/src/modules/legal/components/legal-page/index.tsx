import React from "react"

/**
 * A single titled block within a legal document. Paragraphs, lists and links
 * passed as children inherit the body styling from the wrapper.
 */
export function LegalSection({
  heading,
  children,
}: {
  heading: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-bold uppercase leading-tight text-ink sm:text-2xl">
        {heading}
      </h2>
      <div className="flex flex-col gap-4 font-family-base text-base font-light leading-relaxed text-ink/75 [&_a]:font-medium [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-2 [&_li]:pl-1 [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  )
}

/**
 * Shared shell for the store's legal / policy pages (terms, privacy, refund…).
 * Mirrors the editorial hero + body rhythm used across the rest of the site.
 */
export default function LegalPage({
  eyebrow,
  title,
  lastUpdated,
  intro,
  children,
}: {
  eyebrow: string
  title: React.ReactNode
  lastUpdated?: string
  intro?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="w-full font-family-heading">
      {/* ───────── Hero ───────── */}
      <section className="border-b-4 border-ink bg-ink px-5 py-16 text-surface sm:px-8 sm:py-20 lg:px-16 lg:py-28">
        <div className="mx-auto flex max-w-4xl flex-col gap-5">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-accent sm:text-sm">
            {eyebrow}
          </span>
          <h1 className="text-[clamp(2.5rem,9vw,5rem)] font-extrabold uppercase leading-[0.9]">
            {title}
          </h1>
          {lastUpdated && (
            <span className="font-family-base text-sm font-light text-surface/60">
              Last updated: {lastUpdated}
            </span>
          )}
          {intro && (
            <p className="max-w-2xl font-family-base text-lg font-light text-surface/80">
              {intro}
            </p>
          )}
        </div>
      </section>

      {/* ───────── Body ───────── */}
      <section className="bg-surface px-5 py-12 sm:px-8 sm:py-16 lg:px-16 lg:py-24">
        <div className="mx-auto flex max-w-4xl flex-col gap-10">{children}</div>
      </section>
    </div>
  )
}

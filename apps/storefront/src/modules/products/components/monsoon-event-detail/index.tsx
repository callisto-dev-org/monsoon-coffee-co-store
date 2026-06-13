import Image from "next/image"
import { marked } from "marked"

import type { EventDetail } from "@lib/data/event-details"

type Props = {
  event: EventDetail
}

// Brand-styled event sheet shown on an event product page — venue, date, seats,
// a Markdown description, the "what's in store" rundown, and a photo gallery.
export default function MonsoonEventDetail({ event }: Props) {
  const location = [event.venue, event.city].filter(Boolean).join(", ")
  const highlights = (event.highlights ?? []).filter(Boolean)
  const images = (event.images ?? []).filter(Boolean)

  const facts: Array<{ label: string; value: string }> = []
  if (location) facts.push({ label: "Location", value: location })
  if (event.date_label) facts.push({ label: "When", value: event.date_label })
  if (event.partner) facts.push({ label: "With", value: event.partner })
  if (event.seats_total != null)
    facts.push({ label: "Seats", value: `Limited to ${event.seats_total}` })

  const descriptionHtml = event.description
    ? (marked.parse(event.description, { async: false }) as string)
    : ""

  if (
    !facts.length &&
    !descriptionHtml &&
    !highlights.length &&
    !images.length
  ) {
    return null
  }

  return (
    <section className="w-full border-y-4 border-ink bg-surface px-6 py-12 font-family-heading sm:py-16 lg:px-12">
      <div className="mx-auto w-full max-w-7xl">
        <span className="text-sm font-medium uppercase tracking-widest text-accent sm:text-base">
          The Event
        </span>

        {/* Facts — auto-fit so the row stays balanced no matter how many
            fields are filled in. */}
        {facts.length > 0 && (
          <dl
            className="mt-6 grid gap-px overflow-hidden border-2 border-ink bg-ink"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            }}
          >
            {facts.map((f) => (
              <div key={f.label} className="flex flex-col gap-1 bg-surface p-5">
                <dt className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
                  {f.label}
                </dt>
                <dd className="text-lg font-bold uppercase leading-tight text-ink sm:text-xl">
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {descriptionHtml && (
          <div
            className="mt-8 max-w-3xl font-family-base text-base leading-7 text-ink/75 sm:text-lg [&_a]:text-accent [&_a]:underline [&_h2]:mt-6 [&_h2]:font-family-heading [&_h2]:text-xl [&_h2]:font-bold [&_h2]:uppercase [&_h2]:text-ink [&_h3]:mt-5 [&_h3]:font-bold [&_h3]:text-ink [&_li]:mb-1 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-4 [&_strong]:text-ink [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: descriptionHtml }}
          />
        )}

        {highlights.length > 0 && (
          <div className="mt-10">
            <span className="text-lg font-bold uppercase tracking-tight text-ink sm:text-2xl">
              What&apos;s in store
            </span>
            <ul className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {highlights.map((h, i) => (
                <li
                  key={i}
                  className="flex gap-3 border-2 border-ink bg-surface p-4 shadow-[4px_4px_0px_0px_var(--mc-ink)]"
                >
                  <span
                    aria-hidden
                    className="mt-0.5 font-family-heading text-base font-black text-accent"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-family-base text-sm leading-6 text-ink/80 sm:text-base">
                    {h}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {images.length > 0 && (
          <div className="mt-10">
            <span className="text-lg font-bold uppercase tracking-tight text-ink sm:text-2xl">
              Gallery
            </span>
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {images.map((url, i) => (
                <div
                  key={`${url}-${i}`}
                  className="relative aspect-square overflow-hidden border-2 border-ink"
                >
                  <Image
                    src={url}
                    alt={`Event photo ${i + 1}`}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

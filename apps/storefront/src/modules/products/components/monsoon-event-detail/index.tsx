import Image from "next/image"
import { marked } from "marked"

import type { EventDetail } from "@lib/data/event-details"

type Props = {
  event: EventDetail
}

// "14:30" -> "2:30 PM". Returns null for blank or malformed input.
function formatTime(hhmm?: string | null): string | null {
  if (!hhmm) return null
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim())
  if (!m) return null
  let h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return null
  const period = h < 12 ? "AM" : "PM"
  h = h % 12 || 12
  return `${h}:${String(min).padStart(2, "0")} ${period}`
}

// Brand-styled event sheet shown on an event product page — venue, date, seats,
// a Markdown description, the "what's in store" rundown, and a photo gallery.
export default function MonsoonEventDetail({ event }: Props) {
  const location = [event.venue, event.city].filter(Boolean).join(", ")
  const highlights = (event.highlights ?? []).filter(Boolean)
  const images = (event.images ?? []).filter(Boolean)

  const startTime = formatTime(event.start_time)
  const endTime = formatTime(event.end_time)
  const timeRange = startTime
    ? endTime
      ? `${startTime} – ${endTime}`
      : startTime
    : null

  // Location is pushed last on purpose: with the flex-grow layout below, the
  // items on a short final row stretch to fill the width, so keeping Location
  // last lets it expand into the bigger box (and it usually has the longest
  // value).
  const facts: Array<{ label: string; value: string }> = []
  if (event.date_label) facts.push({ label: "When", value: event.date_label })
  if (timeRange) facts.push({ label: "Time", value: timeRange })
  if (event.partner) facts.push({ label: "With", value: event.partner })
  if (event.seats_total != null)
    facts.push({ label: "Seats", value: `Limited to ${event.seats_total}` })
  if (location) facts.push({ label: "Location", value: location })

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

        {/* Facts — auto-fit so every field sits in a single row on large
            screens and the columns drop off one at a time as the viewport
            narrows (down to a single column on phones). Borders live on each
            cell (not a bg-ink gap), so a partially filled row never leaves an
            empty black cell behind. */}
        {facts.length > 0 && (
          <dl className="mt-6 flex flex-wrap border-l-2 border-t-2 border-ink">
            {facts.map((f) => (
              <div
                key={f.label}
                className="flex min-w-0 grow basis-[150px] flex-col gap-1 border-b-2 border-r-2 border-ink bg-surface p-5 sm:basis-[220px]"
              >
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
            className="mt-8 max-w-3xl [overflow-wrap:anywhere] font-family-base text-base leading-7 text-ink/75 sm:text-lg [&>*:first-child]:mt-0 [&_a]:text-accent [&_a]:underline [&_a]:[overflow-wrap:anywhere] [&_h1]:mt-10 [&_h1]:mb-4 [&_h1]:font-family-heading [&_h1]:text-2xl [&_h1]:font-black [&_h1]:uppercase [&_h1]:tracking-tight [&_h1]:text-ink [&_h1:not(:empty)]:after:mt-3 [&_h1:not(:empty)]:after:block [&_h1:not(:empty)]:after:h-1 [&_h1:not(:empty)]:after:w-20 [&_h1:not(:empty)]:after:bg-accent [&_h1:not(:empty)]:after:content-[''] [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:font-family-heading [&_h2]:text-xl [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-tight [&_h2]:text-ink [&_h2:not(:empty)]:after:mt-3 [&_h2:not(:empty)]:after:block [&_h2:not(:empty)]:after:h-1 [&_h2:not(:empty)]:after:w-16 [&_h2:not(:empty)]:after:bg-accent [&_h2:not(:empty)]:after:content-[''] [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:font-family-heading [&_h3]:font-bold [&_h3]:uppercase [&_h3]:tracking-tight [&_h3]:text-ink [&_h3:not(:empty)]:after:mt-2 [&_h3:not(:empty)]:after:block [&_h3:not(:empty)]:after:h-1 [&_h3:not(:empty)]:after:w-12 [&_h3:not(:empty)]:after:bg-accent [&_h3:not(:empty)]:after:content-[''] [&_li]:mb-2 [&_ol]:mb-6 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:marker:text-ink/50 [&_p]:mb-5 [&_p:last-child]:mb-0 [&_strong]:text-ink [&_ul]:mb-6 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:marker:text-accent"
            dangerouslySetInnerHTML={{ __html: descriptionHtml }}
          />
        )}

        {highlights.length > 0 && (
          <div className="mt-12">
            <h3 className="text-xl font-black uppercase tracking-tight text-ink sm:text-2xl">
              What to expect
            </h3>
            <div className="mt-2 h-1 w-16 bg-accent" />
            <ul className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
              {highlights.map((h, i) => (
                <li
                  key={i}
                  className="flex items-start gap-4 border-2 border-ink bg-surface p-5 shadow-[5px_5px_0px_0px_var(--mc-ink)] transition-transform duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0px_0px_var(--mc-ink)]"
                >
                  <span
                    aria-hidden
                    className="shrink-0 font-family-heading text-lg font-black leading-6 text-accent"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 [overflow-wrap:anywhere] font-family-base text-sm leading-6 text-ink/80 sm:text-base">
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

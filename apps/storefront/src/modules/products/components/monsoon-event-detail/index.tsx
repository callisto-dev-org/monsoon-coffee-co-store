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

// Minutes between two "HH:MM" times, or null if it doesn't make sense
// (malformed, or end at/before start — we don't model overnight events).
function durationMinutes(start: string, end: string): number | null {
  const toMin = (t: string) => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim())
    return m ? Number(m[1]) * 60 + Number(m[2]) : null
  }
  const a = toMin(start)
  const b = toMin(end)
  if (a == null || b == null) return null
  const diff = b - a
  return diff > 0 ? diff : null
}

// Builds "10:00 AM – 12:30 PM · 2h 30m". End and duration are optional, so a
// start-only event renders just "10:00 AM".
function formatSchedule(
  start?: string | null,
  end?: string | null
): string | null {
  const s = formatTime(start)
  if (!s) return null
  const e = formatTime(end)
  if (!e) return s
  const mins = durationMinutes(start!, end!)
  if (mins == null) return `${s} – ${e}`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  const dur = [h ? `${h}h` : "", m ? `${m}m` : ""].filter(Boolean).join(" ")
  return dur ? `${s} – ${e} · ${dur}` : `${s} – ${e}`
}

// Brand-styled event sheet shown on an event product page — venue, date, seats,
// a Markdown description, the "what's in store" rundown, and a photo gallery.
export default function MonsoonEventDetail({ event }: Props) {
  const location = [event.venue, event.city].filter(Boolean).join(", ")
  const highlights = (event.highlights ?? []).filter(Boolean)
  const images = (event.images ?? []).filter(Boolean)

  const schedule = formatSchedule(event.start_time, event.end_time)

  const facts: Array<{ label: string; value: string }> = []
  if (location) facts.push({ label: "Location", value: location })
  if (event.date_label) facts.push({ label: "When", value: event.date_label })
  if (schedule) facts.push({ label: "Time", value: schedule })
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

/* ─────────────── Store location config ───────────────
   Address comes from NEXT_PUBLIC_STORE_ADDRESS. The map embed needs no API key
   — it geocodes the query string below, and the same value is shown verbatim. */
const STORE_ADDRESS =
  process.env.NEXT_PUBLIC_STORE_ADDRESS ||
  "100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038, India"

const HOURS = [
  { day: "Mon — Fri", time: "8:00 — 20:00" },
  { day: "Saturday", time: "9:00 — 21:00" },
  { day: "Sunday", time: "9:00 — 18:00" },
]

export default function StoreMap() {
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(
    STORE_ADDRESS
  )}&output=embed`
  const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    STORE_ADDRESS
  )}`

  return (
    <section className="w-full bg-surface px-5 py-16 font-family-heading sm:px-8 sm:py-20 lg:px-16 lg:py-24">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        {/* Details */}
        <div className="flex flex-col gap-6">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-accent sm:text-sm">
            Visit The Roastery
          </span>
          <h2 className="text-3xl font-extrabold uppercase leading-[0.92] text-ink sm:text-4xl lg:text-5xl">
            Find Us <br /> In Person.
          </h2>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">
              Address
            </span>
            <p className="font-family-base text-base text-ink/80 sm:text-lg">
              {STORE_ADDRESS}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">
              Hours
            </span>
            <dl className="flex flex-col gap-1 font-family-base text-base text-ink/80">
              {HOURS.map((h) => (
                <div
                  key={h.day}
                  className="flex items-center justify-between border-b border-ink/10 py-1.5"
                >
                  <dt>{h.day}</dt>
                  <dd className="tabular-nums">{h.time}</dd>
                </div>
              ))}
            </dl>
          </div>

          <a
            href={directionsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-2 bg-ink px-6 py-3.5 text-xs font-bold uppercase tracking-[0.18em] text-surface transition-colors hover:bg-accent"
          >
            Get Directions →
          </a>
        </div>

        {/* Map */}
        <div className="relative min-h-[20rem] w-full overflow-hidden border-4 border-ink lg:min-h-[28rem]">
          <iframe
            title={`Map to ${STORE_ADDRESS}`}
            src={mapSrc}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 h-full w-full grayscale-[0.2]"
            style={{ border: 0 }}
            allowFullScreen
          />
        </div>
      </div>
    </section>
  )
}

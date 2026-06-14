import type {
  CoffeeProfile,
  ExtractionPoint,
} from "@lib/data/coffee-profiles"

type Props = {
  profile: CoffeeProfile
}

const CHART_WIDTH = 720
const CHART_HEIGHT = 320
const PADDING = { top: 24, right: 24, bottom: 40, left: 48 }

export default function MonsoonCoffeeSpec({ profile }: Props) {
  const specs = buildSpecs(profile)
  const hasSpecs = specs.length > 0
  const points = (profile.extraction_profile ?? []).filter(
    (p) => Number.isFinite(p.time_s) && Number.isFinite(p.yield_g)
  )
  const hasChart = points.length >= 2

  if (!hasSpecs && !hasChart && !(profile.tasting_notes?.length)) {
    return null
  }

  return (
    <section className="w-full border-y-2 border-ink bg-surface px-6 py-16 sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-7xl flex-col gap-12">
        <header className="flex flex-col gap-2">
          <span className="font-family-heading text-xs font-bold uppercase tracking-[0.18em] text-accent">
            Technical Sheet
          </span>
          <h2 className="font-family-heading text-4xl font-black uppercase leading-[0.95] tracking-tight text-ink sm:text-5xl">
            The Stash of This Lot
          </h2>
        </header>

        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_2fr]">
          {hasSpecs && (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5 self-start lg:grid-cols-1">
              {specs.map((s) => (
                <div key={s.label} className="flex flex-col gap-1">
                  <dt className="font-family-heading text-[10px] font-bold uppercase tracking-[0.18em] text-ink/55">
                    {s.label}
                  </dt>
                  <dd className="font-family-heading text-lg font-black uppercase text-ink">
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          <div className="flex flex-col gap-6">
            {(profile.tasting_notes ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(profile.tasting_notes ?? []).map((note) => (
                  <span
                    key={note}
                    className="border-2 border-ink bg-surface px-3 py-1 font-family-heading text-xs font-bold uppercase tracking-[0.16em] text-ink"
                  >
                    {note}
                  </span>
                ))}
              </div>
            )}

            {hasChart ? (
              <ExtractionChart points={points} />
            ) : (
              <p className="font-family-base text-sm text-ink/55">
                Extraction profile not recorded for this lot.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function buildSpecs(profile: CoffeeProfile) {
  const out: { label: string; value: string }[] = []
  if (profile.origin) out.push({ label: "Origin", value: profile.origin })
  if (profile.altitude_m) {
    out.push({ label: "Altitude", value: `${profile.altitude_m} m` })
  }
  if (profile.varietal) out.push({ label: "Varietal", value: profile.varietal })
  if (profile.process) out.push({ label: "Process", value: profile.process })
  if (profile.roast_level) {
    out.push({ label: "Roast", value: profile.roast_level })
  }
  if (profile.harvest_year) {
    out.push({ label: "Harvest", value: String(profile.harvest_year) })
  }
  if (profile.recommended_ratio) {
    out.push({ label: "Ratio", value: profile.recommended_ratio })
  }
  if (profile.roast_date) {
    const d = new Date(profile.roast_date)
    if (!Number.isNaN(d.getTime())) {
      out.push({
        label: "Roasted",
        value: d.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      })
    }
  }
  return out
}

function ExtractionChart({ points }: { points: ExtractionPoint[] }) {
  const sorted = [...points].sort((a, b) => a.time_s - b.time_s)

  const xs = sorted.map((p) => p.time_s)
  const ys = sorted.map((p) => p.yield_g)
  const xMin = 0
  const xMax = Math.max(...xs, 1)
  const yMin = 0
  const yMax = Math.max(...ys, 1)

  const innerW = CHART_WIDTH - PADDING.left - PADDING.right
  const innerH = CHART_HEIGHT - PADDING.top - PADDING.bottom

  const x = (v: number) =>
    PADDING.left + ((v - xMin) / (xMax - xMin || 1)) * innerW
  const y = (v: number) =>
    PADDING.top + innerH - ((v - yMin) / (yMax - yMin || 1)) * innerH

  const pathD = sorted
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.time_s)},${y(p.yield_g)}`)
    .join(" ")

  const areaD =
    `M${x(sorted[0].time_s)},${y(yMin)} ` +
    sorted.map((p) => `L${x(p.time_s)},${y(p.yield_g)}`).join(" ") +
    ` L${x(sorted[sorted.length - 1].time_s)},${y(yMin)} Z`

  const xTicks = niceTicks(xMin, xMax, 5)
  const yTicks = niceTicks(yMin, yMax, 5)

  return (
    <figure className="flex flex-col gap-3 border-2 border-ink bg-[var(--mc-surface-alt,#f5f1ea)] p-5">
      <figcaption className="flex items-baseline justify-between font-family-heading">
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-ink/65">
          Extraction Profile
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink/45">
          Time (s) → Yield (g)
        </span>
      </figcaption>

      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        role="img"
        aria-label="Extraction profile chart"
        className="h-auto w-full"
      >
        {/* y grid */}
        {yTicks.map((t) => (
          <g key={`y-${t}`}>
            <line
              x1={PADDING.left}
              x2={CHART_WIDTH - PADDING.right}
              y1={y(t)}
              y2={y(t)}
              stroke="var(--mc-ink, #1c1c1c)"
              strokeOpacity={t === 0 ? 0.5 : 0.12}
              strokeWidth={1}
              strokeDasharray={t === 0 ? "0" : "3 4"}
            />
            <text
              x={PADDING.left - 8}
              y={y(t)}
              dominantBaseline="middle"
              textAnchor="end"
              fontSize={11}
              fontFamily="ui-monospace, monospace"
              fill="var(--mc-ink, #1c1c1c)"
              fillOpacity={0.55}
            >
              {formatTick(t)}
            </text>
          </g>
        ))}

        {/* x ticks */}
        {xTicks.map((t) => (
          <g key={`x-${t}`}>
            <line
              x1={x(t)}
              x2={x(t)}
              y1={PADDING.top}
              y2={CHART_HEIGHT - PADDING.bottom}
              stroke="var(--mc-ink, #1c1c1c)"
              strokeOpacity={0.06}
              strokeWidth={1}
            />
            <text
              x={x(t)}
              y={CHART_HEIGHT - PADDING.bottom + 16}
              textAnchor="middle"
              fontSize={11}
              fontFamily="ui-monospace, monospace"
              fill="var(--mc-ink, #1c1c1c)"
              fillOpacity={0.55}
            >
              {formatTick(t)}s
            </text>
          </g>
        ))}

        {/* axes */}
        <line
          x1={PADDING.left}
          x2={PADDING.left}
          y1={PADDING.top}
          y2={CHART_HEIGHT - PADDING.bottom}
          stroke="var(--mc-ink, #1c1c1c)"
          strokeWidth={1.5}
        />
        <line
          x1={PADDING.left}
          x2={CHART_WIDTH - PADDING.right}
          y1={CHART_HEIGHT - PADDING.bottom}
          y2={CHART_HEIGHT - PADDING.bottom}
          stroke="var(--mc-ink, #1c1c1c)"
          strokeWidth={1.5}
        />

        {/* area + line */}
        <path d={areaD} fill="var(--mc-accent, #c1422b)" fillOpacity={0.12} />
        <path
          d={pathD}
          fill="none"
          stroke="var(--mc-accent, #c1422b)"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* points */}
        {sorted.map((p, i) => (
          <g key={i}>
            <circle
              cx={x(p.time_s)}
              cy={y(p.yield_g)}
              r={4}
              fill="var(--mc-surface, #fff)"
              stroke="var(--mc-ink, #1c1c1c)"
              strokeWidth={2}
            />
          </g>
        ))}
      </svg>
    </figure>
  )
}

function niceTicks(min: number, max: number, count: number): number[] {
  if (max <= min) return [min]
  const step = (max - min) / count
  const niceStep = niceNum(step)
  const ticks: number[] = []
  let v = Math.ceil(min / niceStep) * niceStep
  while (v <= max + 1e-9) {
    ticks.push(Number(v.toFixed(4)))
    v += niceStep
  }
  if (ticks[0] > min) ticks.unshift(min)
  return ticks
}

function niceNum(range: number): number {
  const exp = Math.floor(Math.log10(range))
  const frac = range / Math.pow(10, exp)
  let nf: number
  if (frac < 1.5) nf = 1
  else if (frac < 3) nf = 2
  else if (frac < 7) nf = 5
  else nf = 10
  return nf * Math.pow(10, exp)
}

function formatTick(n: number): string {
  if (Math.abs(n) >= 100) return n.toFixed(0)
  if (Math.abs(n) >= 10) return n.toFixed(0)
  return Number(n.toFixed(1)).toString()
}

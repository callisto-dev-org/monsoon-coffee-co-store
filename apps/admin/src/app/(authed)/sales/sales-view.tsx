"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import { getSales, type SalesPoint } from "./actions"

type Product = { id: string; title: string; thumbnail?: string | null }

const PALETTE = [
  "#C68E4F", // mc-primary
  "#83541A", // mc-accent
  "#1A1C1C", // mc-ink
  "#514539", // mc-secondary
  "#7C9885",
  "#B8634A",
  "#3B5BA5",
  "#A8703F",
]

function isoDaysAgo(n: number) {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString().slice(0, 10)
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function SalesView({ products }: { products: Product[] }) {
  const [selected, setSelected] = useState<string[]>(() =>
    products.slice(0, Math.min(3, products.length)).map((p) => p.id)
  )
  const [from, setFrom] = useState(isoDaysAgo(30))
  const [to, setTo] = useState(todayIso())
  const [metric, setMetric] = useState<"revenue" | "units">("revenue")
  const [data, setData] = useState<SalesPoint[]>([])
  const [orderCount, setOrderCount] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  useEffect(() => {
    if (!selected.length) {
      setData([])
      return
    }
    setError(null)
    const fromIso = new Date(from + "T00:00:00.000Z").toISOString()
    const toIso = new Date(to + "T23:59:59.999Z").toISOString()
    start(async () => {
      const res = await getSales(selected, fromIso, toIso, metric)
      if (res.ok) {
        setData(res.data || [])
        setOrderCount(res.orderCount || 0)
      } else {
        setError(res.error || "Failed.")
        setData([])
      }
    })
  }, [selected, from, to, metric])

  const titleByPid = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p.title])),
    [products]
  )

  const totals = useMemo(() => {
    const t: Record<string, number> = {}
    for (const p of data) {
      for (const pid of selected) {
        t[pid] = (t[pid] || 0) + (Number(p[pid] || 0))
      }
    }
    return t
  }, [data, selected])

  const grandTotal = useMemo(
    () => Object.values(totals).reduce((a, b) => a + b, 0),
    [totals]
  )

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="space-y-5">
        <div className="border-2 border-mc-ink bg-mc-surface p-4 shadow-[4px_4px_0px_0px_rgb(var(--mc-ink-rgb))]">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-mc-secondary">
            Date range
          </p>
          <div className="mt-3 space-y-2">
            <DateField label="From" value={from} onChange={setFrom} />
            <DateField label="To" value={to} onChange={setTo} />
          </div>
          <div className="mt-4 flex gap-2">
            {[7, 30, 90].map((n) => (
              <button
                key={n}
                onClick={() => {
                  setFrom(isoDaysAgo(n))
                  setTo(todayIso())
                }}
                className="flex-1 border border-mc-ink/30 px-2 py-1.5 font-display text-[10px] font-bold uppercase tracking-[0.16em] hover:border-mc-ink"
              >
                {n}d
              </button>
            ))}
          </div>
        </div>

        <div className="border-2 border-mc-ink bg-mc-surface p-4 shadow-[4px_4px_0px_0px_rgb(var(--mc-ink-rgb))]">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-mc-secondary">
            Metric
          </p>
          <div className="mt-3 flex border border-mc-ink/40">
            {(["revenue", "units"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`flex-1 px-3 py-2 font-display text-[11px] font-bold uppercase tracking-[0.18em] ${
                  metric === m
                    ? "bg-mc-ink text-mc-surface"
                    : "text-mc-secondary hover:text-mc-ink"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="border-2 border-mc-ink bg-mc-surface shadow-[4px_4px_0px_0px_rgb(var(--mc-ink-rgb))]">
          <header className="flex items-center justify-between border-b border-mc-ink/20 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-mc-secondary">
              Products ({selected.length})
            </p>
            <button
              onClick={() => setSelected([])}
              className="text-[10px] uppercase tracking-widest text-mc-secondary hover:text-mc-ink"
            >
              clear
            </button>
          </header>
          <ul className="max-h-[420px] overflow-y-auto">
            {products.length === 0 && (
              <li className="px-4 py-3 text-xs text-mc-secondary">No products.</li>
            )}
            {products.map((p, i) => {
              const checked = selected.includes(p.id)
              const colorIdx = selected.indexOf(p.id)
              return (
                <li key={p.id}>
                  <label className="flex cursor-pointer items-center gap-3 border-b border-mc-ink/10 px-4 py-2.5 hover:bg-mc-ink/5">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(p.id)}
                      className="h-4 w-4 accent-mc-primary"
                    />
                    {checked && (
                      <span
                        aria-hidden
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ background: PALETTE[colorIdx % PALETTE.length] }}
                      />
                    )}
                    <span className="truncate text-sm">{p.title}</span>
                  </label>
                </li>
              )
            })}
          </ul>
        </div>
      </aside>

      <section className="space-y-5">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <SummaryStat label="Orders in window" value={orderCount} />
          <SummaryStat
            label={metric === "revenue" ? "Total revenue" : "Total units"}
            value={grandTotal}
            format={metric === "revenue" ? "money" : "int"}
          />
          <SummaryStat label="Days" value={data.length} />
          <SummaryStat label="Products tracked" value={selected.length} />
        </div>

        <div className="border-2 border-mc-ink bg-mc-surface p-4 shadow-[6px_6px_0px_0px_rgb(var(--mc-ink-rgb))]">
          <header className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-black uppercase">
              {metric === "revenue" ? "Daily revenue" : "Daily units sold"}
            </h2>
            {pending && (
              <span className="text-[10px] uppercase tracking-widest text-mc-secondary">
                loading…
              </span>
            )}
          </header>

          {error && (
            <p className="mb-3 border-l-2 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="h-[420px]">
            {selected.length === 0 ? (
              <EmptyMsg>Select at least one product on the left.</EmptyMsg>
            ) : data.length === 0 && !pending ? (
              <EmptyMsg>No data for this window.</EmptyMsg>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(26,28,28,0.08)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#514539" }}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(26,28,28,0.2)" }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#514539" }}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(26,28,28,0.2)" }}
                    width={56}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#F9F9F9",
                      border: "2px solid #1A1C1C",
                      borderRadius: 0,
                      fontSize: 12,
                    }}
                    formatter={(v: any, name: string) => [v, titleByPid[name] || name]}
                  />
                  <Legend formatter={(v) => titleByPid[v as string] || v} />
                  {selected.map((pid, i) => (
                    <Line
                      key={pid}
                      type="monotone"
                      dataKey={pid}
                      name={pid}
                      stroke={PALETTE[i % PALETTE.length]}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {selected.length > 0 && data.length > 0 && (
          <div className="border-2 border-mc-ink bg-mc-surface shadow-[4px_4px_0px_0px_rgb(var(--mc-ink-rgb))]">
            <header className="border-b border-mc-ink/20 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-mc-secondary">
                Totals per product
              </p>
            </header>
            <ul>
              {selected.map((pid, i) => (
                <li
                  key={pid}
                  className="flex items-center gap-3 border-b border-mc-ink/10 px-4 py-2.5 last:border-b-0"
                >
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ background: PALETTE[i % PALETTE.length] }}
                  />
                  <span className="flex-1 text-sm">{titleByPid[pid] || pid}</span>
                  <span className="font-mono tabular-nums text-sm">
                    {metric === "revenue"
                      ? formatMoney(totals[pid] || 0)
                      : (totals[pid] || 0).toFixed(0)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  )
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-mc-secondary">
        {label}
      </span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border-2 border-mc-ink/30 px-2 py-1.5 font-mono text-sm focus:border-mc-primary outline-none"
      />
    </label>
  )
}

function SummaryStat({
  label,
  value,
  format = "int",
}: {
  label: string
  value: number
  format?: "int" | "money"
}) {
  return (
    <div className="border-2 border-mc-ink bg-mc-surface px-4 py-3 shadow-[4px_4px_0px_0px_rgb(var(--mc-ink-rgb))]">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-mc-secondary">
        {label}
      </p>
      <p className="mt-1 font-display text-xl font-black tabular-nums">
        {format === "money" ? formatMoney(value) : value.toFixed(0)}
      </p>
    </div>
  )
}

function EmptyMsg({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid h-full place-items-center text-sm text-mc-secondary">
      {children}
    </div>
  )
}

function formatMoney(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

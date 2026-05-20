"use client"

import Image from "next/image"
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { SolidButton } from "@modules/common/components/monsoon/buttons"
import type { BrewRecipe } from "@lib/data/brews"

type ProtocolMethod = {
  name: string
  description: string
}

type BrewStat = {
  label: string
  value: string
  accent?: boolean
}

type BrewProtocol = {
  id: string
  method: string
  title: string
  summary: string
  methods: ProtocolMethod[]
  stats: BrewStat[]
  image?: string | null
}

function recipesToProtocols(recipes: BrewRecipe[]): BrewProtocol[] {
  return recipes.map((r) => {
    const schema = r.brew_method.param_schema ?? []
    const params = (r.params ?? {}) as Record<string, unknown>
    const stats: BrewStat[] = schema.length
      ? schema
          .map((p, i) => {
            const raw = params[p.key]
            const value =
              raw == null || raw === ""
                ? "—"
                : `${String(raw)}${p.unit ? p.unit.toUpperCase() : ""}`
            return {
              label: p.label.toUpperCase(),
              value,
              accent: i === 1 || i === 2,
            }
          })
          .slice(0, 5)
      : Object.entries(params)
          .slice(0, 5)
          .map(([k, v], i) => ({
            label: k.toUpperCase().replace(/_/g, " "),
            value: String(v ?? "—"),
            accent: i === 1 || i === 2,
          }))

    // Prefer per-recipe step overrides (rare); fall back to the method's
    // shared technique steps.
    const recipeSteps = (r.steps ?? []).filter(
      (s) => s.name?.trim() || s.description?.trim()
    )
    const methodSteps = (r.brew_method.steps ?? []).filter(
      (s) => s.name?.trim() || s.description?.trim()
    )

    return {
      id: r.brew_method.name?.toUpperCase() || r.brew_method.slug,
      method:
        (r.brew_method.method_label || r.brew_method.summary || "").toUpperCase() ||
        "EXTRACTION METHOD",
      title: (r.title || r.brew_method.name).toUpperCase(),
      summary: r.summary || r.brew_method.summary || "",
      methods: recipeSteps.length > 0 ? recipeSteps : methodSteps,
      stats,
      image: r.brew_method.image_url,
    }
  })
}

function ScrollablePanel({
  children,
  className = "",
  resetKey,
}: {
  children: ReactNode
  className?: string
  resetKey?: string
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [canScrollDown, setCanScrollDown] = useState(false)

  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0 })
  }, [resetKey])

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const update = () =>
      setCanScrollDown(
        panel.scrollTop + panel.clientHeight < panel.scrollHeight - 4
      )
    update()
    panel.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)
    const observer = new ResizeObserver(update)
    observer.observe(panel)
    return () => {
      panel.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
      observer.disconnect()
    }
  }, [])

  return (
    <div
      ref={panelRef}
      className={`scrollbar-hidden relative flex min-h-0 flex-col overflow-y-auto ${className}`}
    >
      <div className="flex-1">{children}</div>
      <div
        className={`pointer-events-none sticky bottom-0 z-10 mt-auto flex items-end justify-center bg-gradient-to-t from-surface via-surface/90 to-transparent px-4 pb-4 pt-10 transition-opacity duration-200 ${
          canScrollDown ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex items-center gap-2 border-2 border-ink bg-[var(--mc-primary)] px-4 py-2 text-sm font-black uppercase tracking-[0.28em] text-ink shadow-[4px_4px_0_var(--mc-ink)]">
          <span>Scroll</span>
          <span className="text-lg leading-none">↓</span>
        </div>
      </div>
    </div>
  )
}

function BrewLabModal({
  isOpen,
  onClose,
  protocols,
}: {
  isOpen: boolean
  onClose: () => void
  protocols: BrewProtocol[]
}) {
  const [activeProtocolId, setActiveProtocolId] = useState<string>(
    protocols[0]?.id ?? ""
  )

  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null
  const activeProtocol =
    protocols.find((p) => p.id === activeProtocolId) ?? protocols[0]

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-hidden bg-ink/55 px-4 pb-8 pt-24 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        type="button"
        aria-label="Close brew lab modal"
        onClick={onClose}
        className="absolute right-6 top-6 grid h-11 w-11 place-items-center border-4 border-ink bg-surface text-2xl font-black text-ink transition-transform hover:-translate-y-0.5 hover:-translate-x-0.5"
      >
        ×
      </button>
      {protocols.length === 0 || !activeProtocol ? (
        <section
          className="grid h-[calc(100vh-7rem)] w-full max-w-7xl min-h-0 place-items-center overflow-hidden border-4 border-ink bg-surface font-family-heading shadow-[12px_12px_0_var(--mc-ink)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-8 py-12 text-center max-w-2xl">
            <p className="text-2xl font-semibold tracking-tight text-accent">
              THE LAB
            </p>
            <h2 className="mt-4 text-5xl lg:text-7xl font-black leading-[0.9] tracking-tight text-ink">
              NO SUGGESTIONS YET
            </h2>
            <p className="mt-6 text-base lg:text-lg leading-relaxed text-ink/55 uppercase tracking-widest">
              Our roasters haven't dialled in a brew profile for this coffee
              yet. Check back soon — extraction data, timing charts and step-by-
              step protocols will appear here.
            </p>
          </div>
        </section>
      ) : (
      <section
        className="grid h-[calc(100vh-7rem)] w-full max-w-7xl min-h-0 grid-cols-[372px_minmax(0,1fr)] overflow-hidden border-4 border-ink bg-surface font-family-heading shadow-[12px_12px_0_var(--mc-ink)] max-[1100px]:grid-cols-1"
        onClick={(e) => e.stopPropagation()}
      >
        <ScrollablePanel className="border-r-4 border-ink max-[1100px]:border-r-0 max-[1100px]:border-b-4">
          <div className="border-b-4 border-ink px-8 py-8">
            <p className="text-4xl font-black tracking-tight text-ink md:text-5xl">
              THE LAB
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-accent">
              EXTRACTION METHODS
            </p>
          </div>
          {protocols.map((protocol, index) => {
            const isActive = activeProtocol.id === protocol.id
            return (
              <button
                key={protocol.id}
                type="button"
                onClick={() => setActiveProtocolId(protocol.id)}
                className={`${
                  isActive
                    ? "bg-ink text-surface"
                    : "border-b-4 border-ink bg-surface text-ink hover:bg-[var(--mc-primary)]/20"
                } w-full px-8 py-9 text-left transition-colors ${
                  index === protocols.length - 1 ? "border-b-0" : ""
                }`}
              >
                <p className="text-4xl font-black tracking-tight">
                  {protocol.id}
                </p>
                <p
                  className={`text-lg tracking-[0.16em] ${
                    isActive ? "text-surface/55" : "text-ink/45"
                  }`}
                >
                  {protocol.method}
                </p>
                <p
                  className={`mt-4 max-w-xs text-sm leading-relaxed tracking-wide ${
                    isActive ? "text-surface/70" : "text-ink/65"
                  }`}
                >
                  {protocol.summary}
                </p>
              </button>
            )
          })}
        </ScrollablePanel>

        <ScrollablePanel resetKey={activeProtocol.id} className="min-h-0">
          <div className="flex min-h-0 flex-col">
            <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)] border-b-4 border-ink max-[1100px]:grid-cols-1">
              <div className="border-r-4 border-ink px-10 py-12 max-[1100px]:border-r-0 max-[1100px]:border-b-4">
                <p className="text-xl font-semibold tracking-tight text-ink/80">
                  {activeProtocol.id} PROTOCOL
                </p>
                <h2 className="mt-5 max-w-lg text-6xl lg:text-7xl font-black leading-[0.9] tracking-tight text-ink">
                  {activeProtocol.title}
                </h2>
                <p className="mt-6 max-w-xl text-lg leading-relaxed tracking-wide text-ink/45 uppercase">
                  {activeProtocol.summary}
                </p>
              </div>
              <div className="relative overflow-hidden bg-[#eef0ef] min-h-[280px]">
                <Image
                  src={activeProtocol.image || "/monsoon/images/Product.png"}
                  alt={`${activeProtocol.id} brew kettle`}
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {activeProtocol.stats.length > 0 && (
              <div className="grid grid-cols-5 border-b-4 border-ink bg-surface max-[780px]:grid-cols-2">
                {activeProtocol.stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="flex flex-col items-center justify-center border-r-4 border-ink px-4 py-8 text-center last:border-r-0 max-[780px]:border-r-0 max-[780px]:border-t-4"
                  >
                    <span className="text-sm font-medium uppercase tracking-widest text-ink/60">
                      {stat.label}
                    </span>
                    <span
                      className={`mt-3 text-4xl font-black tracking-tight ${
                        stat.accent ? "text-accent" : "text-ink"
                      }`}
                    >
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col">
              {activeProtocol.methods.length === 0 ? (
                <p className="px-10 py-12 text-base text-ink/55">
                  Steps for this protocol haven't been published yet.
                </p>
              ) : (
                activeProtocol.methods.map((method, index) => (
                  <div
                    key={`${activeProtocol.id}-${method.name}-${index}`}
                    className="flex items-start gap-8 border-t-4 border-ink px-10 py-10 first:border-t-0"
                  >
                    <p
                      className={`grid h-20 w-20 shrink-0 place-items-center border-4 border-ink text-4xl font-black leading-none ${
                        index % 2 === 0
                          ? "bg-ink text-surface"
                          : "bg-surface text-ink"
                      }`}
                    >
                      {index + 1}
                    </p>
                    <div className="max-w-4xl">
                      <h3 className="text-3xl lg:text-4xl font-black tracking-tight text-ink">
                        {method.name}
                      </h3>
                      <p className="mt-4 text-base lg:text-lg leading-relaxed text-ink/80">
                        {method.description}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </ScrollablePanel>
      </section>
      )}
    </div>
  )
}

export default function MonsoonBrewLab({ brews = [] }: { brews?: BrewRecipe[] }) {
  const [isOpen, setIsOpen] = useState(false)

  const protocols = useMemo<BrewProtocol[]>(
    () => recipesToProtocols(brews),
    [brews]
  )

  const hasBrews = protocols.length > 0

  return (
    <>
      <section className="px-6 lg:px-12 py-16 lg:h-screen flex items-center justify-center relative w-full font-family-heading">
        <div className="bg-ink max-w-7xl w-full lg:h-3/4 gap-4 flex flex-col lg:flex-row">
          <div className="w-full lg:w-3/4 gap-4 p-8 lg:p-12 h-full flex flex-col items-start justify-center">
            <span className="text-5xl lg:text-8xl font-black text-surface tracking-wide">
              BREW <br /> LAB
            </span>
            <span className="text-base lg:text-xl text-surface/75 w-full leading-relaxed">
              {hasBrews
                ? `Maximize the extraction of your selected blend. Our roasters have perfected ${protocols.length} distinct method${protocols.length === 1 ? "" : "s"} for this coffee. Access the technical data and timing charts below.`
                : "Our roasters are still dialling in the extraction profile for this coffee. Open the lab to see what's been published so far."}
            </span>
            <SolidButton
              color="accent"
              className="text-surface font-bold px-8 text-2xl lg:text-3xl py-4 lg:py-6"
              onClick={() => setIsOpen(true)}
            >
              OPEN BREW LAB
            </SolidButton>
          </div>
          <div className="relative w-full lg:w-1/2 h-64 lg:h-full">
            <Image
              src="/monsoon/images/Product.png"
              alt="Brew Lab"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>
      <BrewLabModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        protocols={protocols}
      />
    </>
  )
}

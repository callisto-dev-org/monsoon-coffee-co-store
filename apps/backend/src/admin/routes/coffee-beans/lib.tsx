import { Label, Text } from "@medusajs/ui"
import type { ReactNode } from "react"

// Shared between the Coffee Beans extension tabs.

export async function adminFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    // no-store to bypass any browser/SW caching — the admin extension
    // depends on always-fresh data after writes.
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      ...(init?.headers ?? {}),
    },
    ...init,
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`HTTP ${res.status}: ${body}`)
  }
  return (await res.json()) as T
}

export const slugify = (s: string): string =>
  (s ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

export const slugifyKey = (s: string): string =>
  (s ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")

export const Field = ({
  label,
  children,
  colSpan,
}: {
  label: string
  children: ReactNode
  colSpan?: boolean
}) => (
  <div className={colSpan ? "md:col-span-2" : undefined}>
    <Label className="mb-1 block">{label}</Label>
    {children}
  </div>
)

export const SectionHeading = ({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) => (
  <div className="mb-3">
    <Label className="text-base font-semibold">{title}</Label>
    {subtitle && (
      <Text size="small" className="text-ui-fg-muted">
        {subtitle}
      </Text>
    )}
  </div>
)

export const COFFEE_BEANS_HANDLE = "coffee-beans"
export const COFFEE_BEANS_NAME = "Coffee Beans"

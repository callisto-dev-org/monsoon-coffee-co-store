import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Badge,
  Button,
  Container,
  FocusModal,
  Heading,
  Table,
  Text,
  toast,
} from "@medusajs/ui"
import { useEffect, useMemo, useState } from "react"

import { EventEditor, adminFetch } from "../../components/event-detail-editor"

// Standalone "Events" area (sidebar route) — mirrors the Coffee Beans / Messages
// pages. Lists every product in an event-ish category; editing opens a modal.
const EVENT_CATEGORY_MATCHERS = ["event", "workshop"]

type EventProduct = { id: string; title: string }
type Category = { id: string; name?: string; handle?: string }
type EventSummary = {
  product_id: string
  venue?: string | null
  date_label?: string | null
  seats_total?: number | null
  booking_closed?: boolean | null
}

type AdminUser = {
  id: string
  email?: string | null
  first_name?: string | null
  last_name?: string | null
}

type Ticket = {
  id: string
  code: string
  email?: string | null
  status: "valid" | "checked_in" | "void"
  checked_in_at?: string | null
  checked_in_by?: string | null
  order_display_id?: string | null
}

const STATUS_BADGE: Record<
  Ticket["status"],
  { color: "green" | "blue" | "red"; label: string }
> = {
  valid: { color: "green", label: "Valid" },
  checked_in: { color: "blue", label: "Checked in" },
  void: { color: "red", label: "Void" },
}

function formatDateTime(value?: string | null): string {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

// Per-event ticket list: who booked, check-in status/time, plus the "Reset
// event" action (void every ticket so the door list starts fresh).
const TicketsModal = ({ product }: { product: EventProduct }) => {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [userMap, setUserMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)

  async function load() {
    setLoading(true)
    try {
      // Resolve the actor ids stored on tickets (checked_in_by) to human names.
      const [res, usersRes] = await Promise.all([
        adminFetch<{ tickets: Ticket[] }>(
          `/admin/event-tickets?product_id=${encodeURIComponent(product.id)}`
        ),
        adminFetch<{ users: AdminUser[] }>(
          "/admin/users?limit=1000&fields=id,email,first_name,last_name"
        ).catch(() => ({ users: [] as AdminUser[] })),
      ])
      setTickets(res.tickets ?? [])
      const m: Record<string, string> = {}
      for (const u of usersRes.users ?? []) {
        const name = [u.first_name, u.last_name].filter(Boolean).join(" ").trim()
        m[u.id] = name || u.email || u.id
      }
      setUserMap(m)
    } catch (e) {
      toast.error("Failed to load tickets", {
        description: (e as Error).message,
      })
    } finally {
      setLoading(false)
    }
  }

  const displayBy = (id?: string | null): string => {
    if (!id) return ""
    return userMap[id] ?? (id.startsWith("user_") ? "Staff" : id)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id])

  const counts = useMemo(() => {
    let valid = 0
    let checked = 0
    let voided = 0
    for (const t of tickets) {
      if (t.status === "valid") valid++
      else if (t.status === "checked_in") checked++
      else voided++
    }
    return { total: tickets.length, valid, checked, voided }
  }, [tickets])

  async function resetEvent() {
    const active = counts.total - counts.voided
    if (
      !confirm(
        `Void ALL ${active} active ticket(s) for "${product.title}"?\n\n` +
          "This clears the door list and cannot be undone. Already-voided " +
          "tickets are left as-is."
      )
    ) {
      return
    }
    setResetting(true)
    try {
      const res = await adminFetch<{ voided: number }>(
        "/admin/event-tickets/void-all",
        {
          method: "POST",
          body: JSON.stringify({ product_id: product.id }),
        }
      )
      toast.success(`Event reset — ${res.voided} ticket(s) voided`)
      load()
    } catch (e) {
      toast.error("Reset failed", { description: (e as Error).message })
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="divide-y">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge color="grey">{counts.total} total</Badge>
          <Badge color="green">{counts.valid} valid</Badge>
          <Badge color="blue">{counts.checked} checked in</Badge>
          <Badge color="red">{counts.voided} void</Badge>
        </div>
        <Button
          variant="danger"
          size="small"
          onClick={resetEvent}
          isLoading={resetting}
          disabled={loading || counts.total - counts.voided === 0}
        >
          Reset event (void all tickets)
        </Button>
      </div>

      {loading ? (
        <Text className="px-6 py-10 text-ui-fg-muted">Loading…</Text>
      ) : tickets.length === 0 ? (
        <Text className="px-6 py-10 text-ui-fg-muted">
          No tickets yet — they are minted automatically when an order for this
          event is placed.
        </Text>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Code</Table.HeaderCell>
              <Table.HeaderCell>Email</Table.HeaderCell>
              <Table.HeaderCell>Order</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Checked in</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {tickets.map((t) => {
              const badge = STATUS_BADGE[t.status]
              return (
                <Table.Row key={t.id}>
                  <Table.Cell className="whitespace-nowrap font-mono text-xs">
                    {t.code}
                  </Table.Cell>
                  <Table.Cell>{t.email || "—"}</Table.Cell>
                  <Table.Cell>
                    {t.order_display_id ? `#${t.order_display_id}` : "—"}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      color={badge.color}
                      size="2xsmall"
                      className="whitespace-nowrap"
                    >
                      {badge.label}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {t.status === "checked_in" ? (
                      <div className="flex flex-col leading-tight">
                        <span className="whitespace-nowrap text-ui-fg-base">
                          {formatDateTime(t.checked_in_at)}
                        </span>
                        {t.checked_in_by ? (
                          <span className="text-xs text-ui-fg-muted">
                            by {displayBy(t.checked_in_by)}
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-ui-fg-muted">—</span>
                    )}
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table>
      )}
    </div>
  )
}

const EventsPage = () => {
  const [products, setProducts] = useState<EventProduct[]>([])
  const [details, setDetails] = useState<EventSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [noCategory, setNoCategory] = useState(false)
  const [editing, setEditing] = useState<EventProduct | null>(null)
  const [viewingTickets, setViewingTickets] = useState<EventProduct | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const detailByProduct = useMemo(() => {
    const m = new Map<string, EventSummary>()
    for (const d of details) m.set(d.product_id, d)
    return m
  }, [details])

  async function load() {
    setLoading(true)
    try {
      const catRes = await adminFetch<{ product_categories: Category[] }>(
        "/admin/product-categories?fields=id,name,handle&limit=200"
      )
      const eventCatIds = (catRes.product_categories ?? [])
        .filter((c) => {
          const hay = `${c.handle ?? ""} ${c.name ?? ""}`.toLowerCase()
          return EVENT_CATEGORY_MATCHERS.some((m) => hay.includes(m))
        })
        .map((c) => c.id)

      if (!eventCatIds.length) {
        setNoCategory(true)
        setProducts([])
        setDetails([])
        return
      }
      setNoCategory(false)

      const qs = eventCatIds
        .map((id) => `category_id[]=${encodeURIComponent(id)}`)
        .join("&")
      const [prodRes, detailRes] = await Promise.all([
        adminFetch<{ products: EventProduct[] }>(
          `/admin/products?${qs}&fields=id,title&limit=200`
        ),
        adminFetch<{ event_details: EventSummary[] }>("/admin/event-details"),
      ])
      setProducts(prodRes.products ?? [])
      setDetails(detailRes.event_details ?? [])
    } catch (e) {
      toast.error("Failed to load events", {
        description: (e as Error).message,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // Stop / resume booking. Sends only `booking_closed` — the upsert is a partial
  // update, so other event fields are untouched (and a row is created if none
  // exists yet).
  async function toggleBooking(p: EventProduct, currentlyClosed: boolean) {
    setTogglingId(p.id)
    try {
      await adminFetch(`/admin/products/${p.id}/event-detail`, {
        method: "POST",
        body: JSON.stringify({ booking_closed: !currentlyClosed }),
      })
      toast.success(currentlyClosed ? "Booking reopened" : "Booking stopped")
      load()
    } catch (e) {
      toast.error("Failed to update booking", {
        description: (e as Error).message,
      })
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between border-b border-ui-border-base px-6 py-4">
        <div>
          <Heading level="h1">Events</Heading>
          <Text size="small" className="text-ui-fg-muted">
            Every product in an Events category. Edit one to set venue, date,
            seats and details — stop booking, view tickets or reset from here.
          </Text>
        </div>
      </div>

      {loading ? (
        <Text className="px-6 py-10 text-ui-fg-muted">Loading…</Text>
      ) : noCategory ? (
        <div className="px-6 py-10">
          <Text className="text-ui-fg-muted">
            No Events category found. Create a product category named{" "}
            <strong>Events</strong> (or anything containing &ldquo;event&rdquo;
            or &ldquo;workshop&rdquo;), add your event products to it, and
            they&apos;ll show up here.
          </Text>
        </div>
      ) : products.length === 0 ? (
        <div className="px-6 py-10">
          <Text className="text-ui-fg-muted">
            No products in your Events category yet.
          </Text>
        </div>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Event</Table.HeaderCell>
              <Table.HeaderCell>Date</Table.HeaderCell>
              <Table.HeaderCell>Venue</Table.HeaderCell>
              <Table.HeaderCell>Seats</Table.HeaderCell>
              <Table.HeaderCell>Booking</Table.HeaderCell>
              <Table.HeaderCell />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {products.map((p) => {
              const d = detailByProduct.get(p.id)
              const closed = !!d?.booking_closed
              return (
                <Table.Row key={p.id}>
                  <Table.Cell className="font-medium">{p.title}</Table.Cell>
                  <Table.Cell>{d?.date_label || "—"}</Table.Cell>
                  <Table.Cell>{d?.venue || "—"}</Table.Cell>
                  <Table.Cell>{d?.seats_total ?? "—"}</Table.Cell>
                  <Table.Cell>
                    <Badge color={closed ? "red" : "green"} size="2xsmall">
                      {closed ? "Closed" : "Open"}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => setViewingTickets(p)}
                      >
                        Tickets
                      </Button>
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => toggleBooking(p, closed)}
                        isLoading={togglingId === p.id}
                      >
                        {closed ? "Resume booking" : "Stop booking"}
                      </Button>
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => setEditing(p)}
                      >
                        Edit
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table>
      )}

      <FocusModal
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null)
            load()
          }
        }}
      >
        <FocusModal.Content>
          <FocusModal.Header>
            <Heading level="h2">
              {editing ? `Edit — ${editing.title}` : "Edit event"}
            </Heading>
          </FocusModal.Header>
          <FocusModal.Body className="overflow-y-auto">
            <div className="mx-auto w-full max-w-3xl py-4">
              {editing && <EventEditor productId={editing.id} />}
            </div>
          </FocusModal.Body>
        </FocusModal.Content>
      </FocusModal>

      <FocusModal
        open={!!viewingTickets}
        onOpenChange={(open) => {
          if (!open) setViewingTickets(null)
        }}
      >
        <FocusModal.Content>
          <FocusModal.Header>
            <Heading level="h2">
              {viewingTickets
                ? `Tickets — ${viewingTickets.title}`
                : "Tickets"}
            </Heading>
          </FocusModal.Header>
          <FocusModal.Body className="overflow-y-auto">
            <div className="mx-auto w-full max-w-4xl py-2">
              {viewingTickets && <TicketsModal product={viewingTickets} />}
            </div>
          </FocusModal.Body>
        </FocusModal.Content>
      </FocusModal>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Events",
})

export default EventsPage

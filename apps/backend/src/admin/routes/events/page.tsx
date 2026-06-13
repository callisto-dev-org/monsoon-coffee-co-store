import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
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
}

const EventsPage = () => {
  const [products, setProducts] = useState<EventProduct[]>([])
  const [details, setDetails] = useState<EventSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [noCategory, setNoCategory] = useState(false)
  const [editing, setEditing] = useState<EventProduct | null>(null)

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

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between border-b border-ui-border-base px-6 py-4">
        <div>
          <Heading level="h1">Events</Heading>
          <Text size="small" className="text-ui-fg-muted">
            Every product in an Events category. Edit one to set venue, date,
            seats, description and images.
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
              <Table.HeaderCell />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {products.map((p) => {
              const d = detailByProduct.get(p.id)
              return (
                <Table.Row key={p.id}>
                  <Table.Cell className="font-medium">{p.title}</Table.Cell>
                  <Table.Cell>{d?.date_label || "—"}</Table.Cell>
                  <Table.Cell>{d?.venue || "—"}</Table.Cell>
                  <Table.Cell>{d?.seats_total ?? "—"}</Table.Cell>
                  <Table.Cell className="text-right">
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => setEditing(p)}
                    >
                      Edit
                    </Button>
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
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Events",
})

export default EventsPage

import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Badge,
  Button,
  Container,
  Drawer,
  Heading,
  Input,
  Label,
  Select,
  Table,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useEffect, useMemo, useState } from "react"
import { marked } from "marked"

/* ─────────────── Shared fetch helper ─────────────── */

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
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

function formatDate(iso?: string) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/* ─────────────── Types ─────────────── */

type ContactStatus = "new" | "read" | "archived"

type ContactMessage = {
  id: string
  name: string
  email: string
  subject?: string | null
  message: string
  status: ContactStatus
  created_at: string
}

type NewsletterSubscriber = {
  id: string
  email: string
  status: string
  created_at: string
}

const STATUS_COLOR: Record<ContactStatus, "green" | "orange" | "grey"> = {
  new: "green",
  read: "orange",
  archived: "grey",
}

/* ─────────────── Page ─────────────── */

type TabKey = "messages" | "newsletter" | "send"

const TABS: { key: TabKey; label: string }[] = [
  { key: "messages", label: "Contact messages" },
  { key: "newsletter", label: "Newsletter" },
  { key: "send", label: "Send newsletter" },
]

const MessagesPage = () => {
  const [active, setActive] = useState<TabKey>("messages")

  return (
    <Container className="p-0">
      <nav className="flex gap-1 overflow-x-auto border-b border-ui-border-base px-3 pt-3">
        {TABS.map((tab) => {
          const isActive = tab.key === active
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActive(tab.key)}
              className={`relative shrink-0 px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "text-ui-fg-base"
                  : "text-ui-fg-muted hover:text-ui-fg-base"
              }`}
            >
              {tab.label}
              {isActive && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 bg-ui-fg-base" />
              )}
            </button>
          )
        })}
      </nav>

      {active === "messages" && <MessagesTab />}
      {active === "newsletter" && <NewsletterTab />}
      {active === "send" && <SendNewsletterTab />}
    </Container>
  )
}

/* ─────────────── Contact messages tab ─────────────── */

const MessagesTab = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ContactMessage | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await adminFetch<{ contact_messages: ContactMessage[] }>(
        "/admin/contact-messages"
      )
      setMessages(res.contact_messages ?? [])
    } catch (e) {
      toast.error("Failed to load messages", {
        description: (e as Error).message,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function setStatus(m: ContactMessage, status: ContactStatus) {
    try {
      await adminFetch(`/admin/contact-messages/${m.id}`, {
        method: "POST",
        body: JSON.stringify({ status }),
      })
      setMessages((cur) =>
        cur.map((x) => (x.id === m.id ? { ...x, status } : x))
      )
      if (selected?.id === m.id) setSelected({ ...selected, status })
    } catch (e) {
      toast.error("Update failed", { description: (e as Error).message })
    }
  }

  async function destroy(m: ContactMessage) {
    if (!confirm(`Delete the message from ${m.name}? This cannot be undone.`))
      return
    try {
      await adminFetch(`/admin/contact-messages/${m.id}`, { method: "DELETE" })
      setMessages((cur) => cur.filter((x) => x.id !== m.id))
      if (selected?.id === m.id) setSelected(null)
      toast.success("Message deleted")
    } catch (e) {
      toast.error("Delete failed", { description: (e as Error).message })
    }
  }

  function open(m: ContactMessage) {
    setSelected(m)
    if (m.status === "new") setStatus(m, "read")
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-ui-border-base px-6 py-4">
        <div>
          <Heading level="h2">Contact messages</Heading>
          <Text size="small" className="text-ui-fg-muted">
            Messages submitted through the storefront “Contact Us” form.
          </Text>
        </div>
        <Button variant="secondary" size="small" onClick={load}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <Text className="px-6 py-6 text-ui-fg-muted">Loading…</Text>
      ) : messages.length === 0 ? (
        <Text className="px-6 py-12 text-center text-ui-fg-muted">
          No messages yet.
        </Text>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>From</Table.HeaderCell>
              <Table.HeaderCell>Subject</Table.HeaderCell>
              <Table.HeaderCell>Received</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell className="text-right">
                Actions
              </Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {messages.map((m) => (
              <Table.Row key={m.id} className="cursor-pointer">
                <Table.Cell onClick={() => open(m)}>
                  <div className="font-medium">{m.name}</div>
                  <Text size="small" className="text-ui-fg-subtle">
                    {m.email}
                  </Text>
                </Table.Cell>
                <Table.Cell onClick={() => open(m)}>
                  <div className="max-w-xs truncate">
                    {m.subject || (
                      <span className="text-ui-fg-muted">
                        {m.message.slice(0, 48)}…
                      </span>
                    )}
                  </div>
                </Table.Cell>
                <Table.Cell onClick={() => open(m)}>
                  <Text size="small" className="text-ui-fg-muted">
                    {formatDate(m.created_at)}
                  </Text>
                </Table.Cell>
                <Table.Cell onClick={() => open(m)}>
                  <Badge size="2xsmall" color={STATUS_COLOR[m.status]}>
                    {m.status}
                  </Badge>
                </Table.Cell>
                <Table.Cell className="text-right">
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => open(m)}
                  >
                    View
                  </Button>
                  <Button
                    variant="transparent"
                    size="small"
                    className="ml-2 text-ui-fg-error"
                    onClick={() => destroy(m)}
                  >
                    Delete
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}

      <Drawer open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>{selected?.subject || "Message"}</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="flex flex-col gap-4">
            {selected && (
              <>
                <div>
                  <Text size="small" weight="plus">
                    {selected.name}
                  </Text>
                  <Text size="small" className="text-ui-fg-subtle">
                    {selected.email}
                  </Text>
                  <Text size="small" className="text-ui-fg-muted">
                    {formatDate(selected.created_at)}
                  </Text>
                </div>
                <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-4">
                  <Text className="whitespace-pre-wrap">
                    {selected.message}
                  </Text>
                </div>
                <div className="flex items-center gap-2">
                  <Text size="small" className="text-ui-fg-muted">
                    Status
                  </Text>
                  <Select
                    value={selected.status}
                    onValueChange={(v) =>
                      setStatus(selected, v as ContactStatus)
                    }
                  >
                    <Select.Trigger className="w-40">
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value="new">new</Select.Item>
                      <Select.Item value="read">read</Select.Item>
                      <Select.Item value="archived">archived</Select.Item>
                    </Select.Content>
                  </Select>
                  <a
                    href={`mailto:${selected.email}?subject=${encodeURIComponent(
                      `Re: ${selected.subject || "your message"}`
                    )}`}
                    className="ml-auto"
                  >
                    <Button size="small">Reply by email</Button>
                  </a>
                </div>
              </>
            )}
          </Drawer.Body>
        </Drawer.Content>
      </Drawer>
    </div>
  )
}

/* ─────────────── Newsletter tab ─────────────── */

const NewsletterTab = () => {
  const [subs, setSubs] = useState<NewsletterSubscriber[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const res = await adminFetch<{
        newsletter_subscribers: NewsletterSubscriber[]
      }>("/admin/newsletter-subscribers")
      setSubs(res.newsletter_subscribers ?? [])
    } catch (e) {
      toast.error("Failed to load subscribers", {
        description: (e as Error).message,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function destroy(s: NewsletterSubscriber) {
    if (!confirm(`Remove ${s.email} from the list?`)) return
    try {
      await adminFetch(`/admin/newsletter-subscribers/${s.id}`, {
        method: "DELETE",
      })
      setSubs((cur) => cur.filter((x) => x.id !== s.id))
      toast.success("Subscriber removed")
    } catch (e) {
      toast.error("Delete failed", { description: (e as Error).message })
    }
  }

  function exportCsv() {
    const rows = [
      ["email", "status", "subscribed_at"],
      ...subs.map((s) => [s.email, s.status, s.created_at]),
    ]
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "newsletter-subscribers.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-ui-border-base px-6 py-4">
        <div>
          <Heading level="h2">Newsletter subscribers</Heading>
          <Text size="small" className="text-ui-fg-muted">
            {subs.length} subscriber{subs.length === 1 ? "" : "s"} from the
            storefront signup form.
          </Text>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="small"
            onClick={exportCsv}
            disabled={subs.length === 0}
          >
            Export CSV
          </Button>
          <Button variant="secondary" size="small" onClick={load}>
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <Text className="px-6 py-6 text-ui-fg-muted">Loading…</Text>
      ) : subs.length === 0 ? (
        <Text className="px-6 py-12 text-center text-ui-fg-muted">
          No subscribers yet.
        </Text>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Email</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Subscribed</Table.HeaderCell>
              <Table.HeaderCell className="text-right">
                Actions
              </Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {subs.map((s) => (
              <Table.Row key={s.id}>
                <Table.Cell>
                  <div className="font-medium">{s.email}</div>
                </Table.Cell>
                <Table.Cell>
                  <Badge
                    size="2xsmall"
                    color={s.status === "subscribed" ? "green" : "grey"}
                  >
                    {s.status}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <Text size="small" className="text-ui-fg-muted">
                    {formatDate(s.created_at)}
                  </Text>
                </Table.Cell>
                <Table.Cell className="text-right">
                  <Button
                    variant="transparent"
                    size="small"
                    className="text-ui-fg-error"
                    onClick={() => destroy(s)}
                  >
                    Remove
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </div>
  )
}

/* ─────────────── Send newsletter tab ─────────────── */

type Campaign = {
  id: string
  subject: string
  recipients: number
  sent: number
  failed: number
  status: "sending" | "sent" | "partial" | "failed"
  created_at: string
}

const CAMPAIGN_COLOR: Record<
  Campaign["status"],
  "green" | "orange" | "red" | "grey"
> = {
  sent: "green",
  partial: "orange",
  failed: "red",
  sending: "grey",
}

const SendNewsletterTab = () => {
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [recipientCount, setRecipientCount] = useState<number | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [sending, setSending] = useState(false)
  const [showPreview, setShowPreview] = useState(true)

  async function loadMeta() {
    try {
      const [subsRes, campRes] = await Promise.all([
        adminFetch<{ newsletter_subscribers: NewsletterSubscriber[] }>(
          "/admin/newsletter-subscribers"
        ),
        adminFetch<{ newsletter_campaigns: Campaign[] }>(
          "/admin/newsletter/campaigns"
        ),
      ])
      setRecipientCount(
        (subsRes.newsletter_subscribers ?? []).filter(
          (s) => s.status === "subscribed"
        ).length
      )
      setCampaigns(campRes.newsletter_campaigns ?? [])
    } catch (e) {
      toast.error("Failed to load", { description: (e as Error).message })
    }
  }

  useEffect(() => {
    loadMeta()
  }, [])

  const previewHtml = useMemo(() => {
    try {
      return marked.parse(body || "_Nothing to preview yet._") as string
    } catch {
      return ""
    }
  }, [body])

  async function send() {
    if (!subject.trim() || body.trim().length < 2) {
      toast.error("Add a subject and a message body first.")
      return
    }
    if (
      !confirm(
        `Send "${subject.trim()}" to ${
          recipientCount ?? "all"
        } subscriber(s)? This cannot be undone.`
      )
    )
      return

    setSending(true)
    try {
      const res = await adminFetch<{ campaign: Campaign }>(
        "/admin/newsletter/send",
        {
          method: "POST",
          body: JSON.stringify({ subject: subject.trim(), body: body.trim() }),
        }
      )
      const c = res.campaign
      toast.success(
        `Sent to ${c.sent} subscriber(s)${c.failed ? `, ${c.failed} failed` : ""}.`
      )
      setSubject("")
      setBody("")
      loadMeta()
    } catch (e) {
      toast.error("Send failed", { description: (e as Error).message })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-ui-border-base px-6 py-4">
        <div>
          <Heading level="h2">Send newsletter</Heading>
          <Text size="small" className="text-ui-fg-muted">
            Compose in Markdown and blast every active subscriber
            {recipientCount !== null ? ` (${recipientCount} active)` : ""}. Each
            email includes an unsubscribe link.
          </Text>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="small"
            onClick={() => setShowPreview((v) => !v)}
          >
            {showPreview ? "Hide preview" : "Show preview"}
          </Button>
          <Button
            size="small"
            onClick={send}
            disabled={sending || !subject.trim() || body.trim().length < 2}
            isLoading={sending}
          >
            Send to {recipientCount ?? "…"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div>
            <Label className="mb-1 block">Subject *</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="This month at the roastery"
            />
          </div>
          <div>
            <Label className="mb-1 block">Body (Markdown) *</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={16}
              placeholder={"# Hello\n\nWe just dropped a new **micro-lot**…\n\n[Shop now](https://your-store.com/store)"}
              className="font-mono text-sm"
            />
            <Text size="xsmall" className="mt-1 text-ui-fg-muted">
              Supports Markdown: # headings, **bold**, _italic_, [links](url),
              lists.
            </Text>
          </div>
        </div>

        {showPreview && (
          <div className="flex flex-col">
            <Label className="mb-1 block">Preview</Label>
            <div className="flex-1 overflow-auto rounded-lg border border-ui-border-base bg-ui-bg-base p-5">
              <div className="mb-3 border-b border-ui-border-base pb-2">
                <Text size="small" className="text-ui-fg-muted">
                  Subject
                </Text>
                <Text weight="plus">{subject || "(no subject)"}</Text>
              </div>
              <div
                className="prose prose-sm max-w-none text-ui-fg-base [&_a]:text-ui-fg-interactive [&_h1]:mb-2 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:ml-4 [&_li]:list-disc [&_p]:mb-3"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </div>
        )}
      </div>

      {/* History */}
      <div className="border-t border-ui-border-base px-6 py-4">
        <Heading level="h3">Recent sends</Heading>
      </div>
      {campaigns.length === 0 ? (
        <Text className="px-6 pb-8 text-ui-fg-muted">
          No campaigns sent yet.
        </Text>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Subject</Table.HeaderCell>
              <Table.HeaderCell>Recipients</Table.HeaderCell>
              <Table.HeaderCell>Sent</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>When</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {campaigns.map((c) => (
              <Table.Row key={c.id}>
                <Table.Cell>
                  <div className="max-w-xs truncate font-medium">
                    {c.subject}
                  </div>
                </Table.Cell>
                <Table.Cell>{c.recipients}</Table.Cell>
                <Table.Cell>
                  {c.sent}
                  {c.failed ? (
                    <span className="text-ui-fg-error"> / {c.failed} failed</span>
                  ) : null}
                </Table.Cell>
                <Table.Cell>
                  <Badge size="2xsmall" color={CAMPAIGN_COLOR[c.status]}>
                    {c.status}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <Text size="small" className="text-ui-fg-muted">
                    {formatDate(c.created_at)}
                  </Text>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Messages",
})

export default MessagesPage

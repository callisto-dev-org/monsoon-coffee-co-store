// Shared helpers for the event-ticket flow.

// The QR encodes a verify URL (so a phone camera opens the door page), but staff
// may also type the bare code. Accept either: pull `?code=` out of a URL, else
// take the raw string. Always upper-cased + trimmed so lookups are exact.
export function normalizeTicketCode(input: unknown): string {
  let raw = String(input ?? "").trim()
  if (!raw) return ""
  if (/[?&]code=/i.test(raw)) {
    const m = raw.match(/[?&]code=([^&\s]+)/i)
    if (m?.[1]) {
      try {
        raw = decodeURIComponent(m[1])
      } catch {
        raw = m[1]
      }
    }
  }
  return raw.trim().toUpperCase()
}

// Public URL the ticket QR points at: the admin "Ticket Check-in" page with the
// code pre-filled. Falls back to encoding just the code when no backend URL is
// configured (the in-app scanner still recovers the code either way).
export function ticketVerifyUrl(code: string): string {
  const base = (
    process.env.BACKEND_PUBLIC_URL ??
    process.env.MEDUSA_BACKEND_URL ??
    ""
  ).replace(/\/$/, "")
  if (!base) return code
  return `${base}/app/ticket-verify?code=${encodeURIComponent(code)}`
}

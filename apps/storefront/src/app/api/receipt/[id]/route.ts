// Streams the order's PDF receipt from the Medusa backend. Runs server-side so
// the publishable key stays off the client, and lives under /api so the locale
// middleware leaves it alone. The downloaded file is the same PDF attached to
// the order-confirmation email.

const BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL ||
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  "http://localhost:9000"
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ""

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const upstream = await fetch(
    `${BACKEND_URL}/store/orders/${encodeURIComponent(id)}/receipt`,
    {
      headers: { "x-publishable-api-key": PUBLISHABLE_KEY },
      cache: "no-store",
    }
  ).catch(() => null)

  if (!upstream || !upstream.ok) {
    return new Response("Receipt not available", {
      status: upstream?.status ?? 502,
    })
  }

  const pdf = await upstream.arrayBuffer()
  return new Response(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="monsoon-receipt-${id}.pdf"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  })
}

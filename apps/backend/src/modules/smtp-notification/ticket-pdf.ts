import PDFDocument from "pdfkit"
import QRCode from "qrcode"

// Generates a deliberately plain PDF event ticket that gets attached to the
// "your tickets" email. One page-flowing document holds every ticket in the
// order; each ticket is a bordered card carrying the event details (partner,
// venue, date, time), a scannable QR, and the matching admit-one code. The QR
// and the code are two routes to the same verification — scan it at the door,
// or type the code into the admin "Ticket Check-in" page. PDFKit's built-in
// fonts are Latin-1 only, so copy stays plain ASCII.

const INK = "#1A1C1C"
const ACCENT = "#83541A"
const MUTED = "#6C6760"
const WHITE = "#FFFFFF"

export type TicketPdfEvent = {
  partner?: string | null
  venue?: string | null
  city?: string | null
  date_label?: string | null
  start_time?: string | null
  end_time?: string | null
  seats_total?: number | null
}

export type TicketPdfTicket = {
  title: string
  code: string
  unit?: number
  count?: number // how many tickets carry this title (for "#1 of N")
  verifyUrl?: string // what the QR encodes; falls back to the bare code
  event?: TicketPdfEvent | null
}

export type TicketPdfData = {
  display_id?: number | string
  email?: string | null
  tickets: TicketPdfTicket[]
}

const timeRange = (e?: TicketPdfEvent | null): string | null => {
  if (!e) return null
  if (e.start_time && e.end_time) return `${e.start_time} - ${e.end_time}`
  return e.start_time ?? e.end_time ?? null
}

export async function renderTicketPdf(data: TicketPdfData): Promise<Buffer> {
  // Pre-render every QR (async) before we start drawing the doc.
  const qrBuffers = await Promise.all(
    data.tickets.map((t) =>
      QRCode.toBuffer(t.verifyUrl || t.code, {
        type: "png",
        errorCorrectionLevel: "M",
        margin: 1,
        width: 240,
        color: { dark: "#1A1C1Cff", light: "#FFFFFFff" },
      }).catch(() => null)
    )
  )

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 })
      const chunks: Buffer[] = []
      doc.on("data", (c: Buffer) => chunks.push(c))
      doc.on("end", () => resolve(Buffer.concat(chunks)))
      doc.on("error", reject)

      const left = doc.page.margins.left
      const right = doc.page.width - doc.page.margins.right
      const width = right - left

      // ── Header band ──
      doc.rect(left, 50, width, 56).fill(INK)
      doc
        .fillColor(WHITE)
        .font("Helvetica-Bold")
        .fontSize(18)
        .text("MONSOON COFFEE CO.", left + 18, 70)
      doc
        .fillColor("#C68E4F")
        .font("Helvetica-Bold")
        .fontSize(10)
        .text("EVENT TICKET", left, 74, { width: width - 18, align: "right" })

      let y = 124
      doc
        .fillColor(MUTED)
        .font("Helvetica")
        .fontSize(10)
        .text(
          `Order #${data.display_id ?? "-"}  -  Scan the QR or give the code at the door. Each admits one.`,
          left,
          y
        )
      y += 26

      const cardH = 188
      const bottomLimit = doc.page.height - doc.page.margins.bottom

      data.tickets.forEach((t, idx) => {
        if (y + cardH > bottomLimit) {
          doc.addPage()
          y = doc.page.margins.top
        }

        // Card border
        doc.rect(left, y, width, cardH).lineWidth(2).strokeColor(INK).stroke()

        const padX = left + 18
        let cy = y + 16

        // Event title
        doc
          .fillColor(INK)
          .font("Helvetica-Bold")
          .fontSize(15)
          .text(t.title, padX, cy, { width: width - 200 })
        cy += 24

        const e = t.event
        if (e?.partner) {
          doc
            .fillColor(ACCENT)
            .font("Helvetica-Bold")
            .fontSize(9)
            .text(`WITH ${e.partner}`.toUpperCase(), padX, cy, {
              width: width - 200,
            })
          cy += 16
        }

        // Detail rows (label: value), only when present.
        const rows: Array<[string, string]> = []
        const venue = [e?.venue, e?.city].filter(Boolean).join(", ")
        if (venue) rows.push(["WHERE", venue])
        if (e?.date_label) rows.push(["WHEN", e.date_label])
        const time = timeRange(e)
        if (time) rows.push(["TIME", time])

        for (const [label, value] of rows) {
          doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(8).text(label, padX, cy)
          doc
            .fillColor(INK)
            .font("Helvetica")
            .fontSize(10)
            .text(value, padX + 52, cy - 1, { width: width - 200 - 52 })
          cy += 16
        }

        // Ticket index (e.g. "Ticket 1 of 3")
        if (t.count && t.count > 1 && t.unit) {
          doc
            .fillColor(MUTED)
            .font("Helvetica")
            .fontSize(9)
            .text(`Ticket ${t.unit} of ${t.count}`, padX, y + cardH - 24)
        }

        // ── QR + code block on the right ──
        const boxW = 156
        const boxX = right - boxW
        doc.rect(boxX, y, boxW, cardH).fill(INK)
        doc
          .fillColor("#C68E4F")
          .font("Helvetica-Bold")
          .fontSize(8)
          .text("ADMIT ONE", boxX, y + 14, { width: boxW, align: "center" })

        const qr = qrBuffers[idx]
        const qrSize = 96
        const qrX = boxX + (boxW - qrSize) / 2
        const qrY = y + 30
        if (qr) {
          // White quiet-zone behind the QR so it scans against the dark box.
          doc.rect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12).fill(WHITE)
          doc.image(qr, qrX, qrY, { width: qrSize, height: qrSize })
        }

        doc
          .fillColor(WHITE)
          .font("Helvetica-Bold")
          .fontSize(11)
          .text(t.code, boxX + 8, qrY + qrSize + 14, {
            width: boxW - 16,
            align: "center",
          })

        y += cardH + 18
      })

      doc.end()
    } catch (e) {
      reject(e as Error)
    }
  })
}

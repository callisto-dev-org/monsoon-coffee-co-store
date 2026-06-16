import PDFDocument from "pdfkit"
import QRCode from "qrcode"

// Renders the "your tickets" email attachment: a stylized PDF where every
// ticket in the order is a classic tear-stub card — a white body carrying the
// event details, a perforation with punched tear-notches, and a dark "admit
// one" stub holding the QR + matching code. The QR and the code are two routes
// to the same check: scan it at the door, or type the code into the admin
// "Ticket Check-in" page. PDFKit's built-in fonts are Latin-1 only, so copy
// stays plain ASCII (no smart quotes, em dashes, or bullets).

const INK = "#1A1C1C" // near-black body text + stub fill
const ACCENT = "#83541A" // deep coffee for partner / labels
const GOLD = "#C68E4F" // warm gold for header + stub accents
const MUTED = "#6C6760" // secondary text
const LINE = "#E4DFD6" // hairline dividers
const PAPER = "#FFFFFF" // clean white card fill
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

// SVG path for a rectangle with a concave round notch bitten out of each of its
// four corners — the classic admission-ticket silhouette. `rn` is the notch
// radius; sweep flag 0 keeps each arc curving inward (a bite, not a bulge).
function notchedRectPath(
  x: number,
  y: number,
  w: number,
  h: number,
  rn: number
): string {
  return [
    `M ${x + rn} ${y}`,
    `L ${x + w - rn} ${y}`,
    `A ${rn} ${rn} 0 0 0 ${x + w} ${y + rn}`,
    `L ${x + w} ${y + h - rn}`,
    `A ${rn} ${rn} 0 0 0 ${x + w - rn} ${y + h}`,
    `L ${x + rn} ${y + h}`,
    `A ${rn} ${rn} 0 0 0 ${x} ${y + h - rn}`,
    `L ${x} ${y + rn}`,
    `A ${rn} ${rn} 0 0 0 ${x + rn} ${y}`,
    "Z",
  ].join(" ")
}

// Same notch treatment but only on the LEFT two corners (square against the
// seam) — used for the dark stub so its outer corners match the card's.
function notchedLeftRectPath(
  x: number,
  y: number,
  w: number,
  h: number,
  rn: number
): string {
  return [
    `M ${x + rn} ${y}`,
    `L ${x + w} ${y}`,
    `L ${x + w} ${y + h}`,
    `L ${x + rn} ${y + h}`,
    `A ${rn} ${rn} 0 0 0 ${x} ${y + h - rn}`,
    `L ${x} ${y + rn}`,
    `A ${rn} ${rn} 0 0 0 ${x + rn} ${y}`,
    "Z",
  ].join(" ")
}

export async function renderTicketPdf(data: TicketPdfData): Promise<Buffer> {
  // Pre-render every QR (async) before we start drawing the doc.
  const qrBuffers = await Promise.all(
    data.tickets.map((t) =>
      QRCode.toBuffer(t.verifyUrl || t.code, {
        type: "png",
        errorCorrectionLevel: "M",
        margin: 0,
        width: 280,
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
      const bandY = 50
      const bandH = 64
      doc.rect(left, bandY, width, bandH).fill(INK)
      // Warm gold rule pinned to the bottom of the band.
      doc.rect(left, bandY + bandH - 4, width, 4).fill(GOLD)

      doc
        .fillColor(WHITE)
        .font("Helvetica-Bold")
        .fontSize(19)
        .text("MONSOON COFFEE CO.", left + 20, bandY + 16)
      doc
        .fillColor(MUTED)
        .font("Helvetica")
        .fontSize(8)
        .text("THE ROASTERY", left + 20, bandY + 40, { characterSpacing: 2 })
      doc
        .fillColor(GOLD)
        .font("Helvetica-Bold")
        .fontSize(11)
        .text("EVENT TICKET", left, bandY + 26, {
          width: width - 20,
          align: "right",
          characterSpacing: 2,
        })

      // ── Intro line ──
      let y = bandY + bandH + 22
      const count = data.tickets.length
      doc
        .fillColor(MUTED)
        .font("Helvetica")
        .fontSize(10)
        .text(
          `Order #${data.display_id ?? "-"}   /   ${count} ticket${
            count === 1 ? "" : "s"
          }   /   Scan the QR or read out the code at the door. Each admits one.`,
          left,
          y,
          { width }
        )
      y += 28

      const cardH = 198
      const cardR = 14
      const gap = 20
      const stubW = 154
      const bottomLimit = doc.page.height - doc.page.margins.bottom - 24

      data.tickets.forEach((t, idx) => {
        if (y + cardH > bottomLimit) {
          doc.addPage()
          y = doc.page.margins.top
        }

        const seamX = left + stubW // divide between left stub and right body

        // 1. Card body (white), with a round notch bitten out of all 4 corners.
        doc.path(notchedRectPath(left, y, width, cardH, cardR)).fill(PAPER)

        // 2. Dark "admit one" stub on the LEFT, notched on its outer corners to
        //    match the card.
        doc
          .path(notchedLeftRectPath(left, y, stubW, cardH, cardR))
          .fill(INK)

        // 3. One continuous border tracing the ENTIRE notched ticket, drawn on
        //    top so it wraps the dark stub and the white body alike.
        doc
          .path(notchedRectPath(left, y, width, cardH, cardR))
          .lineWidth(2)
          .strokeColor(INK)
          .stroke()

        // ── Body content (right of the divide) ──
        const padX = seamX + 24
        const bodyRight = right - 22
        const bodyW = bodyRight - padX
        let cy = y + 22

        const e = t.event
        if (e?.partner) {
          doc
            .fillColor(ACCENT)
            .font("Helvetica-Bold")
            .fontSize(8.5)
            .text(`WITH ${e.partner}`.toUpperCase(), padX, cy, {
              width: bodyW,
              characterSpacing: 1.5,
            })
          cy += 16
        }

        // Event title.
        doc
          .fillColor(INK)
          .font("Helvetica-Bold")
          .fontSize(17)
          .text(t.title, padX, cy, { width: bodyW, lineGap: 1 })
        cy = Math.max(doc.y, cy) + 12

        // Hairline divider under the title.
        doc
          .moveTo(padX, cy)
          .lineTo(bodyRight, cy)
          .lineWidth(1)
          .strokeColor(LINE)
          .stroke()
        cy += 14

        // Detail rows (label + value), only when present.
        const rows: Array<[string, string]> = []
        const venue = [e?.venue, e?.city].filter(Boolean).join(", ")
        if (venue) rows.push(["WHERE", venue])
        if (e?.date_label) rows.push(["WHEN", e.date_label])
        const time = timeRange(e)
        if (time) rows.push(["TIME", time])

        for (const [label, value] of rows) {
          doc
            .fillColor(GOLD)
            .font("Helvetica-Bold")
            .fontSize(7.5)
            .text(label, padX, cy + 1, { characterSpacing: 1.5 })
          doc
            .fillColor(INK)
            .font("Helvetica")
            .fontSize(10.5)
            .text(value, padX + 54, cy - 1, { width: bodyW - 54 })
          cy = Math.max(doc.y, cy) + 11
        }

        // Ticket index (e.g. "TICKET 1 OF 3"), pinned to the body's lower-left.
        if (t.count && t.count > 1 && t.unit) {
          doc
            .fillColor(MUTED)
            .font("Helvetica-Bold")
            .fontSize(7.5)
            .text(`TICKET ${t.unit} OF ${t.count}`, padX, y + cardH - 24, {
              characterSpacing: 1.5,
            })
        }

        // ── Stub content (left of the seam): ADMIT ONE / QR panel / code ──
        doc
          .fillColor(GOLD)
          .font("Helvetica-Bold")
          .fontSize(8.5)
          .text("ADMIT ONE", left, y + 18, {
            width: stubW,
            align: "center",
            characterSpacing: 2,
          })

        const qr = qrBuffers[idx]
        const panel = 112
        const panelX = left + (stubW - panel) / 2
        const panelY = y + 36
        // White rounded panel so the QR scans cleanly against the dark stub.
        doc.roundedRect(panelX, panelY, panel, panel, 8).fill(WHITE)
        if (qr) {
          const qrSize = panel - 16
          doc.image(qr, panelX + 8, panelY + 8, {
            width: qrSize,
            height: qrSize,
          })
        }

        // Code in monospace so the admit-one string stays unambiguous.
        doc
          .fillColor(WHITE)
          .font("Courier-Bold")
          .fontSize(9.5)
          .text(t.code, left + 6, panelY + panel + 18, {
            width: stubW - 12,
            align: "center",
            characterSpacing: 0,
            lineBreak: false,
          })

        y += cardH + gap
      })

      // ── Footer (current page) ──
      doc
        .fillColor(MUTED)
        .font("Helvetica")
        .fontSize(8)
        .text(
          "Present this ticket at the door, on your phone or printed. Questions? Just reply to your confirmation email.",
          left,
          doc.page.height - doc.page.margins.bottom - 12,
          { width, align: "center" }
        )

      doc.end()
    } catch (e) {
      reject(e as Error)
    }
  })
}

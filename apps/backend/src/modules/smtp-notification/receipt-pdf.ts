import PDFDocument from "pdfkit"

// Generates a branded PDF receipt that gets attached to the order-confirmation
// email. PDFKit's built-in fonts are Latin-1 only (no ₹ glyph), so amounts are
// formatted as "Rs. 1,234.00" to render correctly in every PDF viewer.

const INK = "#1A1C1C"
const PRIMARY = "#C68E4F"
const ACCENT = "#83541A"
const MUTED = "#6C6760"
const LINE = "#E5E1D8"
const WHITE = "#FFFFFF"

const fmt = (n: unknown) =>
  "Rs. " +
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(Number(n)) ? Number(n) : 0)

export type ReceiptItem = {
  title?: string
  quantity: number
  unit_price: number
  total: number
}

export type ReceiptData = {
  display_id?: number | string
  email?: string | null
  placed?: string
  items: ReceiptItem[]
  total: number
  billing_address?: Record<string, unknown> | null
}

export function renderReceiptPdf(data: ReceiptData): Promise<Buffer> {
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
      const amtRight = right // amounts are right-aligned to the page edge
      const qtyX = right - 150
      const qtyW = 60

      // ── Header band ──
      doc.rect(left, 50, width, 56).fill(INK)
      doc
        .fillColor(WHITE)
        .font("Helvetica-Bold")
        .fontSize(18)
        .text("MONSOON COFFEE CO.", left + 18, 70)
      doc
        .fillColor(PRIMARY)
        .font("Helvetica-Bold")
        .fontSize(10)
        .text("RECEIPT", left, 74, { width: width - 18, align: "right" })
      doc.rect(left, 106, width, 5).fill(PRIMARY)

      // ── Order meta ──
      let y = 134
      doc.fillColor(ACCENT).font("Helvetica-Bold").fontSize(9).text("ORDER", left, y)
      doc
        .fillColor(INK)
        .font("Helvetica-Bold")
        .fontSize(22)
        .text("#" + String(data.display_id ?? ""), left, y + 12)

      doc
        .fillColor(ACCENT)
        .font("Helvetica-Bold")
        .fontSize(9)
        .text("PLACED", left, y, { width, align: "right" })
      doc
        .fillColor(INK)
        .font("Helvetica")
        .fontSize(11)
        .text(data.placed ?? "-", left, y + 13, { width, align: "right" })
      if (data.email) {
        doc
          .fillColor(MUTED)
          .font("Helvetica")
          .fontSize(9)
          .text(String(data.email), left, y + 30, { width, align: "right" })
      }

      // ── Items table ──
      y += 58
      doc.rect(left, y, width, 26).fill(INK)
      doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(9)
      doc.text("ITEM", left + 12, y + 9)
      doc.text("QTY", qtyX, y + 9, { width: qtyW, align: "center" })
      doc.text("AMOUNT", amtRight - 120, y + 9, { width: 120 - 12, align: "right" })
      y += 26

      const bottomLimit = doc.page.height - doc.page.margins.bottom - 60
      for (const it of data.items) {
        const titleW = qtyX - (left + 12) - 8
        const titleH = doc.heightOfString(it.title ?? "Item", { width: titleW })
        const h = Math.max(24, titleH + 12)

        if (y + h > bottomLimit) {
          doc.addPage()
          y = doc.page.margins.top
        }

        doc
          .fillColor(INK)
          .font("Helvetica")
          .fontSize(10)
          .text(it.title ?? "Item", left + 12, y + 6, { width: titleW })
        doc
          .fillColor(MUTED)
          .font("Helvetica")
          .fontSize(10)
          .text(String(it.quantity), qtyX, y + 6, { width: qtyW, align: "center" })
        doc
          .fillColor(INK)
          .font("Helvetica-Bold")
          .fontSize(10)
          .text(fmt(it.total), amtRight - 120, y + 6, { width: 120 - 12, align: "right" })
        doc
          .moveTo(left, y + h)
          .lineTo(right, y + h)
          .strokeColor(LINE)
          .lineWidth(1)
          .stroke()
        y += h
      }

      // ── Totals ──
      y += 16
      const tLabelX = right - 240
      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor(MUTED)
        .text("Subtotal", tLabelX, y, { width: 120 })
      doc
        .fillColor(INK)
        .text(fmt(data.total), amtRight - 120, y, { width: 120 - 12, align: "right" })
      y += 24
      doc.moveTo(tLabelX, y).lineTo(right, y).strokeColor(INK).lineWidth(2).stroke()
      y += 12
      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor(INK)
        .text("TOTAL", tLabelX, y + 3, { width: 120 })
      doc
        .fontSize(17)
        .text(fmt(data.total), amtRight - 150, y, { width: 150 - 12, align: "right" })

      // ── Billing address ──
      y += 44
      const addr = data.billing_address
      if (addr) {
        doc.rect(left, y, width, 2).fill(LINE)
        y += 14
        doc.fillColor(ACCENT).font("Helvetica-Bold").fontSize(9).text("BILLED TO", left, y)
        y += 15
        const lines = [
          [addr.first_name, addr.last_name].filter(Boolean).join(" "),
          addr.address_1,
          [addr.city, addr.postal_code].filter(Boolean).join(", "),
          String(addr.country_code ?? "").toUpperCase(),
          addr.phone,
        ].filter(Boolean) as string[]
        doc.fillColor(INK).font("Helvetica").fontSize(10)
        for (const ln of lines) {
          doc.text(String(ln), left, y)
          y += 14
        }
      }

      // ── Footer ──
      const fy = doc.page.height - doc.page.margins.bottom - 26
      doc.moveTo(left, fy).lineTo(right, fy).strokeColor(INK).lineWidth(2).stroke()
      doc
        .fillColor(INK)
        .font("Helvetica-Bold")
        .fontSize(10)
        .text("Monsoon Coffee Co.", left, fy + 8)
      doc
        .fillColor(MUTED)
        .font("Helvetica")
        .fontSize(9)
        .text("Thank you for your order — slow-roasted, small-batch coffee.", left, fy + 9, {
          width,
          align: "right",
        })

      doc.end()
    } catch (e) {
      reject(e as Error)
    }
  })
}

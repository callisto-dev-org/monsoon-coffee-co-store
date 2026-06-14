// Small in-provider template registry. Subscribers pass a `template` id plus a
// `data` payload (the same pattern the local/SendGrid providers expect); this
// turns each known id into a real {subject, html, text} email. Unknown ids fall
// back to data.subject/html/text (or a JSON dump) in the service.
//
// The HTML is intentionally table-based with inline styles so it renders
// consistently across email clients (Gmail, Outlook, Apple Mail). Colors and
// type echo the Monsoon Coffee Co. storefront brand.

type Rendered = { subject?: string; html?: string; text?: string }
type TemplateFn = (data: Record<string, unknown>) => Rendered

// ── Brand tokens (mirror apps/storefront/src/styles/globals.css) ──
const INK = "#1A1C1C"
const PRIMARY = "#C68E4F"
const ACCENT = "#83541A"
const SURFACE = "#F9F9F9"
const SECONDARY = "#514539"
const MUTED = "#6c6760"
const PAPER = "#FFFFFF"
const LINE = "#E5E1D8"
// Custom webfonts don't load reliably in email — fall back to a bold,
// type-forward stack that keeps the brutalist feel.
const HEAD = "'Space Grotesk','Arial Black',Arial,Helvetica,sans-serif"
const BODY = "'Manrope',Arial,Helvetica,sans-serif"

const esc = (v: unknown) =>
  String(v ?? "").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string)
  )

const money = (amount: unknown, currency: unknown) => {
  const n = Number(amount ?? 0)
  const cur = String(currency ?? "INR").toUpperCase()
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: cur,
    }).format(n)
  } catch {
    return `${n} ${cur}`
  }
}

// Bulletproof, table-wrapped CTA button.
const button = (href: string, label: string) => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 6px">
    <tr><td style="background:${INK};border:2px solid ${INK}">
      <a href="${esc(href)}" style="display:inline-block;padding:14px 30px;font-family:${HEAD};font-size:13px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${SURFACE};text-decoration:none">${esc(
  label
)} &nbsp;&rarr;</a>
    </td></tr>
  </table>`

// Large monospaced-looking OTP code chip.
const codeBlock = (code: unknown) => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0 8px">
    <tr><td style="background:${SURFACE};border:2px solid ${INK};padding:16px 26px;font-family:${HEAD};font-size:34px;font-weight:800;letter-spacing:0.3em;color:${INK}">${esc(
  code
)}</td></tr>
  </table>`

const para = (html: string, extra = "") =>
  `<p style="margin:0 0 14px;font-family:${BODY};font-size:15px;line-height:1.65;color:${SECONDARY};${extra}">${html}</p>`

// Full branded email document: header wordmark, accent rule, bordered body
// card, and footer.
const shell = (opts: {
  eyebrow?: string
  heading: string
  bodyHtml: string
  preheader?: string
}) => `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<title>${esc(opts.heading)}</title>
</head>
<body style="margin:0;padding:0;background:${SURFACE};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(
  opts.preheader ?? opts.heading
)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${SURFACE};margin:0;padding:0">
  <tr><td align="center" style="padding:32px 14px">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px">

      <!-- header -->
      <tr><td style="background:${INK};border:2px solid ${INK};padding:24px 30px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="font-family:${HEAD};font-weight:800;font-size:21px;letter-spacing:0.1em;text-transform:uppercase;color:${SURFACE}">MONSOON<span style="color:${PRIMARY}"> COFFEE CO.</span></td>
          <td align="right" style="font-family:${BODY};font-size:10px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:#8d8d8d">Small&nbsp;Batch</td>
        </tr></table>
      </td></tr>
      <tr><td style="height:6px;line-height:6px;font-size:0;background:${PRIMARY};border-left:2px solid ${INK};border-right:2px solid ${INK}">&nbsp;</td></tr>

      <!-- body card -->
      <tr><td style="background:${PAPER};border:2px solid ${INK};border-top:0;padding:34px 30px">
        ${
          opts.eyebrow
            ? `<p style="margin:0 0 12px;font-family:${HEAD};font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:${ACCENT}">${esc(
                opts.eyebrow
              )}</p>`
            : ""
        }
        <h1 style="margin:0 0 18px;font-family:${HEAD};font-size:30px;line-height:1.04;font-weight:800;letter-spacing:-0.01em;text-transform:uppercase;color:${INK}">${esc(
  opts.heading
)}</h1>
        ${opts.bodyHtml}
      </td></tr>

      <!-- footer -->
      <tr><td style="padding:22px 30px 4px">
        <p style="margin:0 0 6px;font-family:${HEAD};font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${INK}">Monsoon Coffee Co.</p>
        <p style="margin:0;font-family:${BODY};font-size:12px;line-height:1.6;color:${MUTED}">Slow-roasted, small-batch coffee.<br/>Questions? Just reply to this email — a real person reads it.</p>
      </td></tr>
      <tr><td style="padding:14px 30px 0">
        <p style="margin:0;font-family:${BODY};font-size:11px;line-height:1.5;color:#9a948b">You're receiving this because you placed an order or signed up at Monsoon Coffee Co.</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`

const registry: Record<string, TemplateFn> = {
  "contact-admin-notification": (d) => ({
    subject: (d.subject_line as string) ?? `New contact message from ${d.name}`,
    html: shell({
      eyebrow: "Inbox",
      heading: "New contact message",
      preheader: `From ${d.name}`,
      bodyHtml:
        para(
          `<strong style="color:${INK}">From:</strong> ${esc(d.name)} &lt;${esc(
            d.email
          )}&gt;`
        ) +
        para(`<strong style="color:${INK}">Subject:</strong> ${esc(d.subject)}`) +
        `<div style="border:2px solid ${LINE};background:${SURFACE};padding:16px 18px;font-family:${BODY};font-size:14px;line-height:1.6;color:${INK};white-space:pre-wrap">${esc(
          d.message
        )}</div>`,
    }),
    text: d.text as string,
  }),

  "newsletter-admin-notification": (d) => ({
    subject: (d.subject_line as string) ?? "New newsletter subscriber",
    html: shell({
      eyebrow: "Audience",
      heading: "New subscriber",
      bodyHtml: para(
        `<strong style="color:${INK}">${esc(
          d.email
        )}</strong> just joined the list.`
      ),
    }),
    text: (d.text as string) ?? `New subscriber: ${d.email}`,
  }),

  "order-placed": (d) => {
    const currency = d.currency_code
    const items =
      (d.items as Array<{
        title?: string
        quantity?: number
        unit_price?: number
        total?: number
      }>) ?? []

    const lineAmount = (i: { quantity?: number; unit_price?: number; total?: number }) =>
      i.total != null
        ? Number(i.total)
        : Number(i.unit_price ?? 0) * Number(i.quantity ?? 0)

    const rows = items
      .map((i) => {
        const qty = Number(i.quantity ?? 0)
        const line = lineAmount(i)
        return `<tr>
          <td style="padding:13px 16px;border-top:1px solid ${LINE};font-family:${BODY};font-size:14px;color:${INK}">${esc(
          i.title
        )}</td>
          <td align="center" style="padding:13px 8px;border-top:1px solid ${LINE};font-family:${BODY};font-size:14px;color:${SECONDARY}">${esc(
          qty
        )}</td>
          <td align="right" style="padding:13px 16px;border-top:1px solid ${LINE};font-family:${HEAD};font-weight:700;font-size:14px;color:${INK}">${money(
          line,
          currency
        )}</td>
        </tr>`
      })
      .join("")

    const subtotal = items.reduce((a, i) => a + lineAmount(i), 0)

    const addr = d.billing_address as Record<string, unknown> | undefined
    const addrHtml = addr
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 4px">
           <tr><td style="border:2px solid ${LINE};background:${SURFACE};padding:16px 18px;font-family:${BODY};font-size:13px;line-height:1.6;color:${INK}">
             <span style="display:block;font-family:${HEAD};font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${ACCENT};margin-bottom:8px">Billed to</span>
             ${esc(
               [addr.first_name, addr.last_name].filter(Boolean).join(" ")
             )}<br/>
             ${addr.address_1 ? esc(addr.address_1) + "<br/>" : ""}
             ${esc(
               [addr.city, addr.postal_code].filter(Boolean).join(", ")
             )}<br/>
             ${esc(String(addr.country_code ?? "").toUpperCase())}
           </td></tr>
         </table>`
      : ""

    const itemsTable = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;border:2px solid ${INK};margin:20px 0 0">
        <tr style="background:${INK}">
          <td style="padding:12px 16px;font-family:${HEAD};font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${SURFACE}">Item</td>
          <td align="center" style="padding:12px 8px;font-family:${HEAD};font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${SURFACE}">Qty</td>
          <td align="right" style="padding:12px 16px;font-family:${HEAD};font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${SURFACE}">Amount</td>
        </tr>
        ${rows}
      </table>`

    const totals = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 6px">
        <tr><td></td><td width="260" style="padding-top:16px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding:4px 0;font-family:${BODY};font-size:13px;color:${SECONDARY}">Subtotal</td>
              <td align="right" style="padding:4px 0;font-family:${BODY};font-size:13px;color:${INK}">${money(
                subtotal,
                currency
              )}</td>
            </tr>
            <tr><td colspan="2" style="border-top:2px solid ${INK};font-size:0;line-height:0;height:8px">&nbsp;</td></tr>
            <tr>
              <td style="font-family:${HEAD};font-size:13px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${INK}">Total</td>
              <td align="right" style="font-family:${HEAD};font-size:22px;font-weight:800;color:${INK}">${money(
                d.total,
                currency
              )}</td>
            </tr>
          </table>
        </td></tr>
      </table>`

    return {
      subject: `Order confirmed — #${esc(d.display_id)}`,
      html: shell({
        eyebrow: `Order #${esc(d.display_id)}`,
        heading: "Thanks for your order",
        preheader: `We've got order #${d.display_id} — total ${money(
          d.total,
          currency
        )}.`,
        bodyHtml:
          para(
            `We've received your order and our roasters are getting it ready. Your receipt is attached to this email as a PDF.`
          ) +
          itemsTable +
          totals +
          addrHtml +
          (d.order_url ? button(String(d.order_url), "View your order") : ""),
      }),
      text: `Thanks for your order! Order #${d.display_id} received. Total: ${money(
        d.total,
        currency
      )}.`,
    }
  },

  "order-shipped": (d) => ({
    subject: `Your order #${esc(d.display_id)} has shipped`,
    html: shell({
      eyebrow: `Order #${esc(d.display_id)}`,
      heading: "On its way",
      preheader: `Order #${d.display_id} has shipped${
        d.courier ? ` via ${d.courier}` : ""
      }.`,
      bodyHtml:
        para(
          `Good news — order <strong style="color:${INK}">#${esc(
            d.display_id
          )}</strong> has left the roastery${
            d.courier ? ` via <strong style="color:${INK}">${esc(d.courier)}</strong>` : ""
          }.`
        ) +
        (d.awb
          ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 6px"><tr><td style="border:2px solid ${LINE};background:${SURFACE};padding:12px 18px;font-family:${BODY};font-size:13px;color:${INK}"><span style="font-family:${HEAD};font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${ACCENT}">Tracking #</span><br/><strong style="font-family:${HEAD};font-size:18px;letter-spacing:0.04em">${esc(
              d.awb
            )}</strong></td></tr></table>`
          : "") +
        (d.tracking_url
          ? button(String(d.tracking_url), "Track your order")
          : ""),
    }),
    text: `Your order #${d.display_id} has shipped${
      d.courier ? ` via ${d.courier}` : ""
    }.${d.awb ? ` Tracking #: ${d.awb}.` : ""}${
      d.tracking_url ? ` Track: ${d.tracking_url}` : ""
    }`,
  }),

  "event-tickets": (d) => {
    const tickets =
      (d.tickets as Array<{
        title?: string
        code?: string
        unit?: number
      }>) ?? []

    const rows = tickets
      .map(
        (t) => `<tr>
          <td style="padding:14px 16px;border-top:1px solid ${LINE};font-family:${BODY};font-size:14px;color:${INK}">${esc(
          t.title
        )}${
          t.unit ? ` <span style="color:${MUTED}">· #${esc(t.unit)}</span>` : ""
        }</td>
          <td align="right" style="padding:14px 16px;border-top:1px solid ${LINE};font-family:${HEAD};font-weight:800;font-size:15px;letter-spacing:0.08em;color:${ACCENT}">${esc(
          t.code
        )}</td>
        </tr>`
      )
      .join("")

    const table = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:2px solid ${INK};margin:20px 0 6px">
        <tr style="background:${INK}">
          <td style="padding:12px 16px;font-family:${HEAD};font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${SURFACE}">Ticket</td>
          <td align="right" style="padding:12px 16px;font-family:${HEAD};font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${SURFACE}">Code</td>
        </tr>
        ${rows}
      </table>`

    const multi = tickets.length > 1
    return {
      subject:
        (d.subject as string) ??
        `Your event ticket${multi ? "s" : ""} — #${esc(d.display_id)}`,
      html: shell({
        eyebrow: `Order #${esc(d.display_id)}`,
        heading: multi ? "Your tickets" : "Your ticket",
        preheader: `Your event ticket code${multi ? "s are" : " is"} inside.`,
        bodyHtml:
          para(
            d.has_pdf
              ? "You're in! Your ticket" +
                  (multi ? "s are" : " is") +
                  " attached to this email as a PDF — show it at the door (each code admits one). The code" +
                  (multi ? "s are" : " is") +
                  " also listed below."
              : "You're in! Show the code below at the door — each code admits one. No printing needed; this email is your ticket."
          ) +
          table +
          para(
            multi
              ? "Bought these for friends? Share one code per guest."
              : "Keep this email safe — it's your entry pass.",
            `font-size:13px;color:${MUTED}`
          ),
      }),
      text:
        `Your event ticket${multi ? "s" : ""} (order #${d.display_id}):\n` +
        tickets
          .map(
            (t) => `- ${t.title}${t.unit ? ` #${t.unit}` : ""}: ${t.code}`
          )
          .join("\n"),
    }
  },

  "login-otp": (d) => ({
    subject: (d.subject as string) ?? `Your login code: ${esc(d.code)}`,
    html: shell({
      eyebrow: "Sign in",
      heading: "Your login code",
      preheader: "Your one-time login code (expires in 10 minutes).",
      bodyHtml:
        para("Use this code to sign in to your account:") +
        codeBlock(d.code) +
        para(
          "This code expires in 10 minutes. If you didn't try to sign in, you can safely ignore this email.",
          `font-size:13px;color:${MUTED}`
        ),
    }),
    text: `Your Monsoon Coffee Co. login code is ${d.code}. It expires in 10 minutes.`,
  }),

  "password-otp": (d) => ({
    subject: (d.subject as string) ?? `Your password code: ${esc(d.code)}`,
    html: shell({
      eyebrow: "Security",
      heading: "Confirm your password change",
      preheader: "Your one-time password code (expires in 10 minutes).",
      bodyHtml:
        para("Use this code to set or change your password:") +
        codeBlock(d.code) +
        para(
          "This code expires in 10 minutes. If you didn't request this, ignore this email and your password will stay unchanged.",
          `font-size:13px;color:${MUTED}`
        ),
    }),
    text: `Your Monsoon Coffee Co. password code is ${d.code}. It expires in 10 minutes.`,
  }),
}

export function renderTemplate(
  template: string,
  data: Record<string, unknown>
): Rendered {
  const fn = registry[template]
  return fn ? fn(data) : {}
}

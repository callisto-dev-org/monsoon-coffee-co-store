// Small in-provider template registry. Subscribers pass a `template` id plus a
// `data` payload (the same pattern the local/SendGrid providers expect); this
// turns each known id into a real {subject, html, text} email. Unknown ids fall
// back to data.subject/html/text (or a JSON dump) in the service.

type Rendered = { subject?: string; html?: string; text?: string }
type TemplateFn = (data: Record<string, unknown>) => Rendered

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

const shell = (heading: string, body: string) => `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
    <h2 style="text-transform:uppercase;letter-spacing:0.04em">${heading}</h2>
    ${body}
    <hr style="border:none;border-top:1px solid #ddd;margin:24px 0" />
    <p style="font-size:12px;color:#888">Monsoon Coffee Co.</p>
  </div>`

const registry: Record<string, TemplateFn> = {
  "contact-admin-notification": (d) => ({
    subject: (d.subject_line as string) ?? `New contact message from ${d.name}`,
    html: shell(
      "New contact message",
      `<p><strong>From:</strong> ${esc(d.name)} &lt;${esc(d.email)}&gt;</p>
       <p><strong>Subject:</strong> ${esc(d.subject)}</p>
       <p style="white-space:pre-wrap">${esc(d.message)}</p>`
    ),
    text: d.text as string,
  }),

  "newsletter-admin-notification": (d) => ({
    subject: (d.subject_line as string) ?? "New newsletter subscriber",
    html: shell(
      "New newsletter subscriber",
      `<p><strong>${esc(d.email)}</strong> just subscribed.</p>`
    ),
    text: (d.text as string) ?? `New subscriber: ${d.email}`,
  }),

  "order-placed": (d) => {
    const items = ((d.items as Array<{
      title?: string
      quantity?: number
      unit_price?: number
    }>) ?? [])
      .map(
        (i) =>
          `<li>${esc(i.title)} × ${esc(i.quantity)} — ${money(
            i.unit_price,
            d.currency_code
          )}</li>`
      )
      .join("")
    return {
      subject: `Order confirmed — #${esc(d.display_id)}`,
      html: shell(
        "Thanks for your order!",
        `<p>We've received order <strong>#${esc(d.display_id)}</strong> and are getting it ready.</p>
         <ul>${items}</ul>
         <p><strong>Total:</strong> ${money(d.total, d.currency_code)}</p>
         <p style="color:#2a7;font-weight:bold">Shipping: FREE</p>
         ${
           d.order_url
             ? `<p><a href="${esc(d.order_url)}" style="color:#1a1a1a">View your order</a></p>`
             : ""
         }`
      ),
      text: `Thanks for your order! Order #${d.display_id} received. Total: ${money(
        d.total,
        d.currency_code
      )}.`,
    }
  },

  "order-shipped": (d) => ({
    subject: `Your order #${esc(d.display_id)} has shipped`,
    html: shell(
      "On its way!",
      `<p>Order <strong>#${esc(d.display_id)}</strong> has shipped${
        d.courier ? ` via ${esc(d.courier)}` : ""
      }.</p>
       ${d.awb ? `<p><strong>Tracking #:</strong> ${esc(d.awb)}</p>` : ""}
       ${
         d.tracking_url
           ? `<p><a href="${esc(
               d.tracking_url
             )}" style="display:inline-block;background:#1a1a1a;color:#fff;padding:12px 20px;text-decoration:none;text-transform:uppercase;letter-spacing:0.1em;font-weight:bold">Track your order</a></p>`
           : ""
       }`
    ),
    text: `Your order #${d.display_id} has shipped${
      d.courier ? ` via ${d.courier}` : ""
    }.${d.awb ? ` Tracking #: ${d.awb}.` : ""}${
      d.tracking_url ? ` Track: ${d.tracking_url}` : ""
    }`,
  }),
}

export function renderTemplate(
  template: string,
  data: Record<string, unknown>
): Rendered {
  const fn = registry[template]
  return fn ? fn(data) : {}
}

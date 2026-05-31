import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CONTACT_MODULE } from "../../../modules/contact"
import { verifyUnsubscribeToken } from "../../../modules/contact/lib"

// Public, key-less route (not under /store) so it works as a plain link clicked
// from an email. Verifies the HMAC token, then flips the subscriber to
// "unsubscribed". Always responds with a friendly HTML page.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const email = String(req.query.email || "")
    .trim()
    .toLowerCase()
  const token = String(req.query.token || "")

  const page = (title: string, body: string) =>
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f4f4f4;font-family:Helvetica,Arial,sans-serif;color:#1a1a1a;">
<div style="max-width:460px;text-align:center;background:#fff;border:1px solid #e5e5e5;padding:40px 32px;">
<div style="font-weight:800;text-transform:uppercase;letter-spacing:1px;margin-bottom:16px;">Monsoon Coffee Co.</div>
<h1 style="font-size:20px;margin:0 0 12px;">${title}</h1>
<p style="color:#666;line-height:1.5;margin:0;">${body}</p>
</div></body></html>`

  if (!email || !token || !verifyUnsubscribeToken(email, token)) {
    res.status(400).type("html").send(
      page(
        "Invalid link",
        "This unsubscribe link is invalid or has expired. Please contact us if you'd like to be removed."
      )
    )
    return
  }

  const svc: any = req.scope.resolve(CONTACT_MODULE)
  const existing = await svc.listNewsletterSubscribers({ email })
  if (existing.length && existing[0].status !== "unsubscribed") {
    await svc.updateNewsletterSubscribers({
      id: existing[0].id,
      status: "unsubscribed",
    })
  }

  res.status(200).type("html").send(
    page(
      "You're unsubscribed",
      `${email} has been removed from the Monsoon Coffee Co. mailing list. Sorry to see you go.`
    )
  )
}

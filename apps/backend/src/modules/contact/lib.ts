import crypto from "crypto"
import { marked } from "marked"

// Secret used to sign unsubscribe links. Falls back to the cookie secret so it
// works out of the box; set NEWSLETTER_SECRET to rotate independently.
const SECRET =
  process.env.NEWSLETTER_SECRET || process.env.COOKIE_SECRET || "supersecret"

// Stateless, per-email unsubscribe token (HMAC) — no DB column needed and it
// works for every existing subscriber.
export function unsubscribeToken(email: string): string {
  return crypto
    .createHmac("sha256", SECRET)
    .update(email.trim().toLowerCase())
    .digest("base64url")
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expected = unsubscribeToken(email)
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token))
  } catch {
    return false
  }
}

export function unsubscribeUrl(baseUrl: string, email: string): string {
  const u = new URL("/newsletter/unsubscribe", baseUrl)
  u.searchParams.set("email", email)
  u.searchParams.set("token", unsubscribeToken(email))
  return u.toString()
}

// Render the admin-authored Markdown into a minimal, email-safe HTML document
// plus a plain-text fallback. Inline-ish styles keep it readable across clients.
export function renderNewsletter(
  markdown: string,
  opts: { subject: string; unsubscribeUrl: string }
): { html: string; text: string } {
  const bodyHtml = marked.parse(markdown) as string

  const html = `<!doctype html>
<html>
  <body style="margin:0;background:#f4f4f4;padding:24px;font-family:Helvetica,Arial,sans-serif;color:#1a1a1a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e5e5e5;">
      <tr>
        <td style="background:#1a1a1a;padding:20px 28px;">
          <span style="color:#ffffff;font-weight:800;text-transform:uppercase;letter-spacing:1px;">Monsoon Coffee Co.</span>
        </td>
      </tr>
      <tr>
        <td style="padding:28px;line-height:1.6;font-size:16px;">
          ${bodyHtml}
        </td>
      </tr>
      <tr>
        <td style="padding:20px 28px;border-top:1px solid #e5e5e5;font-size:12px;color:#888888;">
          You're receiving this because you subscribed to Monsoon Coffee Co.
          <a href="${opts.unsubscribeUrl}" style="color:#888888;">Unsubscribe</a>.
        </td>
      </tr>
    </table>
  </body>
</html>`

  // Crude but serviceable plain-text version: strip tags from the rendered body.
  const text =
    markdown.trim() +
    `\n\n— Monsoon Coffee Co.\nUnsubscribe: ${opts.unsubscribeUrl}`

  return { html, text }
}

"use client"

import { useState, useTransition, type SVGProps } from "react"
import { sendContactMessage } from "@lib/data/contact"

/* ─────────────── Social config ───────────────
   Swap these hrefs for your real accounts. */
const SOCIALS = [
  { label: "Instagram", href: "https://instagram.com/monsooncoffee", Icon: InstagramIcon },
  { label: "X / Twitter", href: "https://twitter.com/monsooncoffee", Icon: XIcon },
  { label: "Facebook", href: "https://facebook.com/monsooncoffee", Icon: FacebookIcon },
  { label: "YouTube", href: "https://youtube.com/@monsooncoffee", Icon: YouTubeIcon },
  { label: "LinkedIn", href: "https://linkedin.com/company/monsooncoffee", Icon: LinkedInIcon },
]

export default function Contact() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle")
  const [feedback, setFeedback] = useState("")
  const [pending, start] = useTransition()

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || message.trim().length < 2) {
      setStatus("error")
      setFeedback("Please fill in your name, email and a short message.")
      return
    }
    start(async () => {
      const res = await sendContactMessage({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      })
      if (res.ok) {
        setStatus("ok")
        setFeedback("Thanks — your message is on its way. We'll be in touch.")
        setName("")
        setEmail("")
        setMessage("")
      } else {
        setStatus("error")
        setFeedback(res.error || "Could not send your message.")
      }
    })
  }

  return (
    <section
      id="contact"
      className="w-full bg-ink px-5 py-16 font-family-heading text-surface sm:px-8 sm:py-20 lg:px-16 lg:py-28"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-20">
        {/* Left: headline + socials */}
        <div className="flex flex-col gap-5">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-accent sm:text-sm">
            Get In Touch
          </span>
          <h2 className="text-[clamp(2.5rem,10vw,5rem)] font-extrabold uppercase leading-[0.88]">
            Let&apos;s Talk <br /> Coffee.
          </h2>
          <p className="max-w-md font-family-base text-base font-light text-surface/75 sm:text-lg">
            Wholesale enquiry, a cupping invite, or just want to nerd out about
            roast curves? Drop us a line — we read every message.
          </p>

          <div className="mt-2 flex flex-wrap gap-3 sm:gap-4">
            {SOCIALS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="grid h-12 w-12 place-items-center border-2 border-surface/30 text-surface transition-colors hover:border-accent hover:bg-accent hover:text-surface sm:h-14 sm:w-14"
              >
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </a>
            ))}
          </div>
        </div>

        {/* Right: message form */}
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-surface/70">
                Name
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={120}
                placeholder="Your name"
                className="w-full border-2 border-surface/30 bg-transparent p-3.5 font-family-base text-surface outline-none transition-colors placeholder:text-surface/40 focus:border-accent"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-surface/70">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@email.com"
                className="w-full border-2 border-surface/30 bg-transparent p-3.5 font-family-base text-surface outline-none transition-colors placeholder:text-surface/40 focus:border-accent"
              />
            </label>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-surface/70">
              Message
            </span>
            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value)
                if (status !== "idle") setStatus("idle")
              }}
              required
              rows={5}
              maxLength={4000}
              placeholder="Tell us what's on your mind…"
              className="w-full resize-y border-2 border-surface/30 bg-transparent p-3.5 font-family-base leading-relaxed text-surface outline-none transition-colors placeholder:text-surface/40 focus:border-accent"
            />
          </label>

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-accent p-4 font-semibold uppercase tracking-[0.12em] text-surface transition-colors hover:bg-accent/90 disabled:opacity-60 sm:w-fit sm:px-12"
          >
            {pending ? "Sending…" : "Send Message"}
          </button>

          {status !== "idle" && (
            <p
              role="status"
              className={`font-family-base text-sm ${
                status === "ok" ? "text-surface/90" : "text-accent"
              }`}
            >
              {feedback}
            </p>
          )}
        </form>
      </div>
    </section>
  )
}

/* ─────────────── Inline social icons ─────────────── */

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.244 2H21.5l-7.5 8.57L22.5 22h-6.75l-5.29-6.91L4.4 22H1.14l8.02-9.17L1.5 2h6.92l4.78 6.32L18.244 2Zm-2.37 18h1.87L7.21 4H5.21l10.664 16Z" />
    </svg>
  )
}

function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" />
    </svg>
  )
}

function YouTubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.51A3.02 3.02 0 0 0 .5 6.2C0 8.08 0 12 0 12s0 3.92.5 5.8a3.02 3.02 0 0 0 2.12 2.14c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3.02 3.02 0 0 0 2.12-2.14C24 15.92 24 12 24 12s0-3.92-.5-5.8ZM9.6 15.57V8.43L15.82 12 9.6 15.57Z" />
    </svg>
  )
}

function LinkedInIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  )
}

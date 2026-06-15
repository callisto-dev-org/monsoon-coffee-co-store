"use client"

import { useState, useTransition, type SVGProps } from "react"
import { sendContactMessage } from "@lib/data/contact"

/* ─────────────── Social config ─────────────── */
const SOCIALS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/monsoon.coffee.co/",
    Icon: InstagramIcon,
  },
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


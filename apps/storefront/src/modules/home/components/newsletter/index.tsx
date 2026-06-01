"use client"

import { useState, useTransition } from "react"
import { subscribeNewsletter } from "@lib/data/contact"

export default function Newsletter() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle")
  const [message, setMessage] = useState("")
  const [pending, start] = useTransition()

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    start(async () => {
      const res = await subscribeNewsletter(email.trim())
      if (res.ok) {
        setStatus("ok")
        setMessage("You're on the list. Watch your inbox.")
        setEmail("")
      } else {
        setStatus("error")
        setMessage(res.error || "Could not subscribe.")
      }
    })
  }

  return (
    <section className="flex w-full flex-col items-center justify-center gap-6 bg-muted px-6 py-14 font-family-heading sm:px-8 sm:py-16 lg:gap-8">
      <span className="text-center text-3xl font-bold text-surface sm:text-4xl lg:text-5xl">
        GET NOTIFIED FIRST.
      </span>
      <span className="text-center text-base text-surface/80 sm:text-lg">
        Hear about our latest drops before everyone else.
      </span>
      <form
        onSubmit={onSubmit}
        className="flex w-full max-w-2xl flex-col gap-3 sm:flex-row sm:gap-4"
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (status !== "idle") setStatus("idle")
          }}
          placeholder="Your Email Address"
          className="w-full border-2 border-white/80 bg-transparent p-4 uppercase text-white placeholder:text-white/60 sm:w-3/4"
        />
        <button
          type="submit"
          disabled={pending}
          className="w-full bg-accent p-4 px-8 font-semibold uppercase text-surface transition-colors hover:bg-accent/90 disabled:opacity-60 sm:w-auto sm:px-12"
        >
          {pending ? "Joining…" : "Subscribe"}
        </button>
      </form>
      {status !== "idle" && (
        <p
          role="status"
          className={`text-center text-sm font-semibold uppercase tracking-[0.12em] ${
            status === "ok" ? "text-surface" : "text-accent"
          }`}
        >
          {message}
        </p>
      )}
    </section>
  )
}

"use client"

import { useActionState } from "react"
import { loginAction } from "./actions"

const initial = { error: "" as string | undefined }

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction as any, initial)

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <form
        action={action}
        className="w-full max-w-md border-2 border-mc-ink bg-mc-surface p-8 shadow-[8px_8px_0px_0px_rgb(var(--mc-ink-rgb))]"
      >
        <p className="font-display text-[11px] font-bold uppercase tracking-[0.24em] text-mc-primary">
          Monsoon · Admin
        </p>
        <h1 className="mt-2 font-display text-3xl font-black uppercase leading-tight">
          Sign in
        </h1>

        <label className="mt-8 block">
          <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-mc-secondary">
            Email
          </span>
          <input
            name="email"
            type="email"
            autoComplete="username"
            required
            className="mt-2 w-full border-2 border-mc-ink bg-transparent px-4 py-3 font-mono text-sm outline-none focus:border-mc-primary"
          />
        </label>

        <label className="mt-5 block">
          <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-mc-secondary">
            Password
          </span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="mt-2 w-full border-2 border-mc-ink bg-transparent px-4 py-3 font-mono text-sm outline-none focus:border-mc-primary"
          />
        </label>

        {state?.error && (
          <p className="mt-4 border-l-2 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-8 w-full border-2 border-mc-ink bg-mc-primary py-3 font-display text-sm font-bold uppercase tracking-[0.16em] text-mc-ink transition-colors hover:bg-mc-accent hover:text-mc-surface disabled:opacity-50"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  )
}

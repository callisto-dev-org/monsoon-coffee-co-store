"use client"

export function Field({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  disabled,
  inputMode,
}: {
  label: string
  value: string
  onChange?: (v: string) => void
  type?: string
  autoComplete?: string
  disabled?: boolean
  inputMode?: "text" | "numeric" | "email" | "tel"
}) {
  return (
    <label className="grid gap-2">
      <span className="font-family-heading text-xs font-bold uppercase tracking-widest text-ink/70">
        {label}
      </span>
      <input
        type={type}
        value={value}
        inputMode={inputMode}
        autoComplete={autoComplete}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        className="h-12 w-full border-2 border-ink bg-surface px-4 font-family-base text-ink focus:outline-none disabled:bg-ink/5 disabled:text-ink/55"
      />
    </label>
  )
}

export function Notice({ ok, message }: { ok: boolean; message: string }) {
  return (
    <p
      className={`font-family-heading text-xs font-bold uppercase tracking-widest ${
        ok ? "text-emerald-700" : "text-red-700"
      }`}
    >
      {message}
    </p>
  )
}

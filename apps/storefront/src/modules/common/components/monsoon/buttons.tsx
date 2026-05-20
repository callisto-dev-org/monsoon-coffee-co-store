import type { ButtonHTMLAttributes } from "react"

export function CTAButton({
  className = "",
  ...buttonProps
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...buttonProps}
      className={`bg-accent cursor-pointer border-2 border-ink drop-shadow-[4px_4px_0px_var(--mc-ink)] text-surface p-6 font-semibold uppercase ${className}`}
    />
  )
}

type ToneProps = {
  color?: "ink" | "accent" | "secondary" | "primary" | "surface"
}

const toneBorder: Record<NonNullable<ToneProps["color"]>, string> = {
  ink: "border-ink",
  accent: "border-accent",
  secondary: "border-[var(--mc-secondary)]",
  primary: "border-[var(--mc-primary)]",
  surface: "border-surface",
}

const toneBg: Record<NonNullable<ToneProps["color"]>, string> = {
  ink: "bg-ink",
  accent: "bg-accent",
  secondary: "bg-[var(--mc-secondary)]",
  primary: "bg-[var(--mc-primary)]",
  surface: "bg-surface",
}

export function OutlineButton({
  color = "ink",
  className = "",
  ...buttonProps
}: ButtonHTMLAttributes<HTMLButtonElement> & ToneProps) {
  return (
    <button
      {...buttonProps}
      className={`border-2 cursor-pointer ${toneBorder[color]} ${className}`}
    />
  )
}

export function SolidButton({
  color = "ink",
  className = "",
  ...buttonProps
}: ButtonHTMLAttributes<HTMLButtonElement> & ToneProps) {
  return (
    <button
      {...buttonProps}
      className={`cursor-pointer ${toneBg[color]} ${className}`}
    />
  )
}

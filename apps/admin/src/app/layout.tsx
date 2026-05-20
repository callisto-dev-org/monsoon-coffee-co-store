import "./globals.css"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Monsoon Admin",
  description: "Inventory & sales for Monsoon Coffee Co.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

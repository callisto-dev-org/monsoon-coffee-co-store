import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { Manrope, Space_Grotesk } from "next/font/google"
import "styles/globals.css"

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
  weight: ["200", "300", "400", "500", "600", "700", "800"],
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
  weight: ["300", "400", "500", "600", "700"],
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  icons: {
    icon: [
      {
        url: "/monsoon/images/favicon-light-32.png",
        media: "(prefers-color-scheme: light)",
        sizes: "32x32",
      },
      {
        url: "/monsoon/images/favicon-light-48.png",
        media: "(prefers-color-scheme: light)",
        sizes: "48x48",
      },
      {
        url: "/monsoon/images/favicon-light-256.png",
        media: "(prefers-color-scheme: light)",
        sizes: "256x256",
      },
      {
        url: "/monsoon/images/favicon-dark-32.png",
        media: "(prefers-color-scheme: dark)",
        sizes: "32x32",
      },
      {
        url: "/monsoon/images/favicon-dark-48.png",
        media: "(prefers-color-scheme: dark)",
        sizes: "48x48",
      },
      {
        url: "/monsoon/images/favicon-dark-256.png",
        media: "(prefers-color-scheme: dark)",
        sizes: "256x256",
      },
    ],
    shortcut: "/monsoon/images/favicon-light-48.png",
    apple: "/monsoon/images/favicon-light-256.png",
  },
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-mode="light"
      suppressHydrationWarning
      className={`${manrope.variable} ${spaceGrotesk.variable}`}
    >
      <body suppressHydrationWarning>
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}

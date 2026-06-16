import { getBaseURL } from "@lib/util/env"
import { SITE } from "@lib/util/seo"
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
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [...SITE.keywords],
  // Note: the default social image is supplied by the app/opengraph-image.jpg
  // and app/twitter-image.jpg file conventions, so `images` is intentionally
  // omitted here to avoid duplicate og:image / twitter:image tags.
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: "en_US",
    url: getBaseURL(),
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
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

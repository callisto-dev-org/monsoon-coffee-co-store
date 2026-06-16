import type { MetadataRoute } from "next"

import { absoluteUrl } from "@lib/util/seo"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Country code is the first path segment, so guard both the bare and
      // localized forms of the private/transactional routes.
      disallow: [
        "/checkout",
        "/*/checkout",
        "/account",
        "/*/account",
        "/*/cart",
        "/*/order",
        "/*/auth",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  }
}

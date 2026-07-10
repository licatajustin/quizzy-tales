import type { MetadataRoute } from "next"

import { getSiteUrl } from "@/lib/stripe/env"

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl()

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/q/"],
        disallow: ["/dashboard", "/auth", "/api"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}

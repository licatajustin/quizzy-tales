import type { Metadata } from "next"

import { LandingPage } from "@/components/marketing/landing-page"
import { JsonLd } from "@/components/seo/json-ld"
import { buildMarketingPageSchemas } from "@/lib/seo/json-ld"
import {
  HOME_DESCRIPTION,
  HOME_TITLE,
  SITE_NAME,
} from "@/lib/seo/site"

export const metadata: Metadata = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: "/",
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
  },
}

export default function Page() {
  return (
    <>
      <JsonLd data={buildMarketingPageSchemas()} />
      <LandingPage />
    </>
  )
}

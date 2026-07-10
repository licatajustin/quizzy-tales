import { faqs } from "@/components/marketing/content"
import { getSiteUrl } from "@/lib/stripe/env"
import {
  DEFAULT_DESCRIPTION,
  HOME_TITLE,
  SITE_NAME,
} from "@/lib/seo/site"

export function buildOrganizationSchema() {
  const siteUrl = getSiteUrl()

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: siteUrl,
    description: DEFAULT_DESCRIPTION,
  }
}

export function buildWebSiteSchema() {
  const siteUrl = getSiteUrl()

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: siteUrl,
    description: DEFAULT_DESCRIPTION,
  }
}

export function buildSoftwareApplicationSchema() {
  const siteUrl = getSiteUrl()

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: siteUrl,
    description: DEFAULT_DESCRIPTION,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free unlimited drafts; live quizzes from $15/month",
    },
  }
}

export function buildFaqPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  }
}

export function buildMarketingPageSchemas() {
  return [
    buildOrganizationSchema(),
    buildWebSiteSchema(),
    buildSoftwareApplicationSchema(),
    buildFaqPageSchema(),
  ]
}

export function buildQuizPageSchema(input: {
  slug: string
  quizTitle: string
  bookTitle: string
  description: string
  outcomeNames: string[]
}) {
  const siteUrl = getSiteUrl()

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${input.quizTitle} — ${input.bookTitle}`,
    description: input.description,
    url: `${siteUrl}/q/${input.slug}`,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: siteUrl,
    },
    about: {
      "@type": "Book",
      name: input.bookTitle,
    },
    keywords: [
      input.bookTitle,
      input.quizTitle,
      HOME_TITLE,
      ...input.outcomeNames,
    ].join(", "),
  }
}

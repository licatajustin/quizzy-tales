import type { MetadataRoute } from "next"

import { getSiteUrl } from "@/lib/stripe/env"
import { createAdminClient } from "@/lib/supabase/admin"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  const admin = createAdminClient()

  const { data: quizzes } = await admin
    .from("quizzes")
    .select("slug, updated_at")
    .eq("status", "published")
    .order("updated_at", { ascending: false })

  const quizEntries =
    quizzes?.map((quiz) => ({
      url: `${siteUrl}/q/${quiz.slug}`,
      lastModified: quiz.updated_at ? new Date(quiz.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })) ?? []

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...quizEntries,
  ]
}

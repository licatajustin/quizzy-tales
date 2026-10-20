import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { QuizPublicFooter } from "@/components/quiz/quiz-public-footer"
import { QuizResultShare } from "@/components/quiz/quiz-result-share"
import { getPublishedOutcomeShare } from "@/lib/quiz/public-outcome"
import { resultPageDescription, resultSharePath } from "@/lib/quiz/share"

type SharedResultPageProps = {
  params: Promise<{ slug: string; outcomeId: string }>
}

export const revalidate = 3600

export async function generateMetadata({
  params,
}: SharedResultPageProps): Promise<Metadata> {
  const { slug, outcomeId } = await params
  const share = await getPublishedOutcomeShare(slug, outcomeId)

  if (!share) {
    return { title: "Result not found" }
  }

  const { snapshot, outcome } = share
  const description = resultPageDescription(outcome, snapshot)
  const title = `${outcome.name} — ${snapshot.quiz_title}`
  const url = resultSharePath(slug, outcome.id)

  return {
    title: {
      absolute: title,
    },
    description,
    openGraph: {
      title: outcome.name,
      description,
      url,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: outcome.name,
      description,
    },
    alternates: {
      canonical: url,
    },
  }
}

export default async function SharedResultPage({
  params,
}: SharedResultPageProps) {
  const { slug, outcomeId } = await params
  const share = await getPublishedOutcomeShare(slug, outcomeId)

  if (!share) {
    notFound()
  }

  return (
    <div className="min-h-svh bg-background">
      <QuizResultShare
        slug={slug}
        snapshot={share.snapshot}
        outcome={share.outcome}
      />
      <QuizPublicFooter />
    </div>
  )
}

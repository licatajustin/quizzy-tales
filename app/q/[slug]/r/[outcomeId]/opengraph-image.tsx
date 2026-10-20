import { notFound } from "next/navigation"

import { normalizeTagline } from "@/lib/quiz/outcome-details"
import { getPublishedOutcomeShare } from "@/lib/quiz/public-outcome"
import { outcomeShareImage } from "@/lib/quiz/share-image"

export const alt = "Quiz result"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const runtime = "nodejs"

export async function generateImageMetadata({
  params,
}: {
  params: Promise<{ slug: string; outcomeId: string }>
}) {
  const { slug, outcomeId } = await params
  const share = await getPublishedOutcomeShare(slug, outcomeId)
  const tagline = normalizeTagline(share?.outcome.tagline)
  const altText = share
    ? tagline
      ? `${share.outcome.name}, ${tagline}`
      : `${share.outcome.name} — ${share.snapshot.quiz_title}`
    : "Quiz result"

  return [
    {
      id: "result",
      alt: altText,
      size,
      contentType,
    },
  ]
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string; outcomeId: string }>
}) {
  const { slug, outcomeId } = await params
  const share = await getPublishedOutcomeShare(slug, outcomeId)

  if (!share) {
    notFound()
  }

  const { snapshot, outcome } = share

  return outcomeShareImage({
    outcomeName: outcome.name,
    tagline: normalizeTagline(outcome.tagline),
    quizTitle: snapshot.quiz_title,
    bookTitle: snapshot.book_title,
    portraitUrl: outcome.image_url,
    theme: snapshot.theme,
  })
}

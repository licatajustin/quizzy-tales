import { notFound } from "next/navigation"

import { getPublishedQuizSnapshot } from "@/lib/quiz/public-outcome"
import { collagePortraitUrls } from "@/lib/quiz/share"
import { quizCollageImage } from "@/lib/quiz/share-image"

export const alt = "Quiz"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const runtime = "nodejs"

export async function generateImageMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const published = await getPublishedQuizSnapshot(slug)
  const snapshot = published?.snapshot

  if (!snapshot || snapshot.cover_image_url) {
    return []
  }

  return [
    {
      id: "share",
      alt: `${snapshot.quiz_title} — ${snapshot.book_title}`,
      size,
      contentType,
    },
  ]
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const published = await getPublishedQuizSnapshot(slug)

  if (!published) {
    notFound()
  }

  const { snapshot } = published

  return quizCollageImage({
    quizTitle: snapshot.quiz_title,
    bookTitle: snapshot.book_title,
    portraitUrls: collagePortraitUrls(snapshot.outcomes),
    theme: snapshot.theme,
  })
}

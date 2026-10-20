import { getPublicQuizBySlug } from "@/lib/quiz/public-quiz"
import { normalizePublishedSnapshot } from "@/lib/quiz/published-snapshot"
import { findPublishedOutcome } from "@/lib/quiz/share"
import type { PublishedQuizSnapshot } from "@/lib/quiz/types"

export async function getPublishedQuizSnapshot(slug: string) {
  const quiz = await getPublicQuizBySlug(slug)
  const raw = quiz?.published_snapshot as PublishedQuizSnapshot | null

  if (!quiz || !raw) {
    return null
  }

  return {
    quizId: quiz.id,
    slug: quiz.slug,
    snapshot: normalizePublishedSnapshot(raw),
  }
}

export async function getPublishedOutcomeShare(
  slug: string,
  outcomeId: string
) {
  const published = await getPublishedQuizSnapshot(slug)
  if (!published) {
    return null
  }

  const outcome = findPublishedOutcome(published.snapshot, outcomeId)
  if (!outcome) {
    return null
  }

  return { ...published, outcome }
}

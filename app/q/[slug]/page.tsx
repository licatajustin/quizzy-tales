import { notFound } from "next/navigation"
import type { Metadata } from "next"

import { QuizPlayer } from "@/components/quiz/quiz-player"
import { getPublicQuizBySlug } from "@/lib/quiz/public-quiz"
import type { PublishedQuizSnapshot } from "@/lib/quiz/types"

type PublicQuizPageProps = {
  params: Promise<{ slug: string }>
}

export const revalidate = 3600

export async function generateMetadata({
  params,
}: PublicQuizPageProps): Promise<Metadata> {
  const { slug } = await params
  const quiz = await getPublicQuizBySlug(slug)
  const snapshot = quiz?.published_snapshot as PublishedQuizSnapshot | null

  if (!snapshot) {
    return { title: "Quiz not found" }
  }

  return {
    title: `${snapshot.quiz_title} | ${snapshot.book_title}`,
    description: `Take the "${snapshot.quiz_title}" personality quiz.`,
  }
}

export default async function PublicQuizPage({ params }: PublicQuizPageProps) {
  const { slug } = await params
  const quiz = await getPublicQuizBySlug(slug)
  const snapshot = quiz?.published_snapshot as PublishedQuizSnapshot | null

  if (!quiz || !snapshot) {
    notFound()
  }

  return (
    <div className="min-h-svh bg-background">
      <QuizPlayer quizId={quiz.id} snapshot={snapshot} />
    </div>
  )
}

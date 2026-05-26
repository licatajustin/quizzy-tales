import { notFound } from "next/navigation"
import type { Metadata } from "next"

import { QuizPlayer } from "@/components/quiz/quiz-player"
import { getPublishedQuizBySlug } from "@/lib/quiz/queries"
import type { PublishedQuizSnapshot } from "@/lib/quiz/types"
import { createClient } from "@/lib/supabase/server"

type PublicQuizPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: PublicQuizPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const quiz = await getPublishedQuizBySlug(supabase, slug)
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
  const supabase = await createClient()
  const quiz = await getPublishedQuizBySlug(supabase, slug)
  const snapshot = quiz?.published_snapshot as PublishedQuizSnapshot | null

  if (!quiz || !snapshot) {
    notFound()
  }

  return (
    <div className="min-h-svh bg-background">
      <QuizPlayer snapshot={snapshot} />
    </div>
  )
}

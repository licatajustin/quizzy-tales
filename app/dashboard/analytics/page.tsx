import { redirect } from "next/navigation"

import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard"
import {
  getAuthorQuizIds,
  getQuizAnalyticsSummary,
  outcomeNamesForQuiz,
  outcomeNamesFromSnapshots,
} from "@/lib/analytics/queries"
import type { PublishedQuizSnapshot } from "@/lib/quiz/types"
import { createClient } from "@/lib/supabase/server"

type AnalyticsPageProps = {
  searchParams: Promise<{ quiz?: string }>
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const { quiz: selectedQuizId } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const quizzes = await getAuthorQuizIds(supabase, user.id)
  const publishedQuizzes = quizzes.filter((quiz) => quiz.status === "published")

  const quizIds =
    selectedQuizId && publishedQuizzes.some((quiz) => quiz.id === selectedQuizId)
      ? [selectedQuizId]
      : publishedQuizzes.map((quiz) => quiz.id)

  const selectedQuiz = selectedQuizId
    ? publishedQuizzes.find((quiz) => quiz.id === selectedQuizId)
    : null

  const outcomeNames = selectedQuiz
    ? outcomeNamesForQuiz(
        selectedQuiz.published_snapshot as PublishedQuizSnapshot | null
      )
    : outcomeNamesFromSnapshots(
        publishedQuizzes.map((quiz) => ({
          id: quiz.id,
          published_snapshot: quiz.published_snapshot as PublishedQuizSnapshot | null,
        }))
      )

  const summary = await getQuizAnalyticsSummary(
    supabase,
    quizIds,
    outcomeNames
  )

  return (
    <AnalyticsDashboard
      quizzes={quizzes}
      selectedQuizId={selectedQuizId ?? null}
      summary={summary}
    />
  )
}

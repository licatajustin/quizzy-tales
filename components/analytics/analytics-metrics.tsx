import { ActivityChart } from "@/components/analytics/activity-chart"
import { AnalyticsStats } from "@/components/analytics/analytics-stats"
import { OutcomeBreakdown } from "@/components/analytics/outcome-breakdown"
import { getDashboardSession } from "@/lib/auth/dashboard-session"
import {
  getPublishedQuizSnapshots,
  getQuizAnalyticsSummary,
  outcomeNamesForQuiz,
  outcomeNamesFromSnapshots,
} from "@/lib/analytics/queries"
import type { PublishedQuizSnapshot } from "@/lib/quiz/types"

type AnalyticsQuizListItem = {
  id: string
  quiz_title: string
  book_title: string
  status: string
}

type AnalyticsMetricsProps = {
  quizzes: AnalyticsQuizListItem[]
  selectedQuizId: string | null
}

export async function AnalyticsMetrics({
  quizzes,
  selectedQuizId,
}: AnalyticsMetricsProps) {
  const { supabase, user } = await getDashboardSession()
  const publishedQuizzes = quizzes.filter((quiz) => quiz.status === "published")

  if (publishedQuizzes.length === 0) {
    return null
  }

  const quizIds =
    selectedQuizId && publishedQuizzes.some((quiz) => quiz.id === selectedQuizId)
      ? [selectedQuizId]
      : publishedQuizzes.map((quiz) => quiz.id)

  const snapshots = await getPublishedQuizSnapshots(
    supabase,
    user.id,
    publishedQuizzes.map((quiz) => quiz.id)
  )

  const selectedQuiz = selectedQuizId
    ? snapshots.find((quiz) => quiz.id === selectedQuizId)
    : null

  const outcomeNames = selectedQuiz
    ? outcomeNamesForQuiz(
        selectedQuiz.published_snapshot as PublishedQuizSnapshot | null
      )
    : outcomeNamesFromSnapshots(
        snapshots.map((quiz) => ({
          id: quiz.id,
          published_snapshot: quiz.published_snapshot as PublishedQuizSnapshot | null,
        }))
      )

  const summary = await getQuizAnalyticsSummary(supabase, quizIds, outcomeNames)

  return (
    <>
      <AnalyticsStats summary={summary} />
      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityChart dailyActivity={summary.dailyActivity} />
        <OutcomeBreakdown outcomeCounts={summary.outcomeCounts} />
      </div>
    </>
  )
}

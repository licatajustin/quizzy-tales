import { Suspense } from "react"

import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard"
import { AnalyticsMetrics } from "@/components/analytics/analytics-metrics"
import { AnalyticsMetricsSkeleton } from "@/components/analytics/analytics-metrics-skeleton"
import { getDashboardSession } from "@/lib/auth/dashboard-session"
import { getAuthorQuizList } from "@/lib/analytics/queries"

type AnalyticsPageProps = {
  searchParams: Promise<{ quiz?: string }>
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const [{ quiz: selectedQuizId }, { supabase, user }] = await Promise.all([
    searchParams,
    getDashboardSession(),
  ])

  const quizzes = await getAuthorQuizList(supabase, user.id)

  return (
    <AnalyticsDashboard
      quizzes={quizzes}
      selectedQuizId={selectedQuizId ?? null}
      metrics={
        <Suspense fallback={<AnalyticsMetricsSkeleton />}>
          <AnalyticsMetrics
            quizzes={quizzes}
            selectedQuizId={selectedQuizId ?? null}
          />
        </Suspense>
      }
    />
  )
}

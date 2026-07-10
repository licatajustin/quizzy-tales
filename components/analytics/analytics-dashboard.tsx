import Link from "next/link"

import { AnalyticsQuizFilter } from "@/components/analytics/analytics-quiz-filter"
import { Button } from "@/components/ui/button"

type AnalyticsDashboardProps = {
  quizzes: {
    id: string
    quiz_title: string
    book_title: string
    status: string
  }[]
  selectedQuizId: string | null
  metrics: React.ReactNode
}

export function AnalyticsDashboard({
  quizzes,
  selectedQuizId,
  metrics,
}: AnalyticsDashboardProps) {
  const publishedQuizzes = quizzes.filter((quiz) => quiz.status === "published")

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Analytics</h1>
          <p className="mt-2 text-muted-foreground">
            See how readers engage with your published quizzes.
          </p>
        </div>

        {publishedQuizzes.length > 0 ? (
          <AnalyticsQuizFilter
            publishedQuizzes={publishedQuizzes}
            selectedQuizId={selectedQuizId}
          />
        ) : null}
      </div>

      {publishedQuizzes.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-card p-6">
          <p className="font-medium">No published quizzes yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Publish a quiz to start tracking views, starts, completions, and
            outcome distribution.
          </p>
          <Button asChild className="mt-4 rounded-full">
            <Link href="/dashboard/quizzes">Go to quizzes</Link>
          </Button>
        </div>
      ) : (
        metrics
      )}
    </div>
  )
}

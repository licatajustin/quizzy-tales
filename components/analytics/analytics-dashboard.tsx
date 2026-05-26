"use client"

import Link from "next/link"

import { ActivityChart } from "@/components/analytics/activity-chart"
import { AnalyticsStats } from "@/components/analytics/analytics-stats"
import { OutcomeBreakdown } from "@/components/analytics/outcome-breakdown"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { QuizAnalyticsSummary } from "@/lib/analytics/types"

type AnalyticsDashboardProps = {
  quizzes: {
    id: string
    quiz_title: string
    book_title: string
    status: string
  }[]
  selectedQuizId: string | null
  summary: QuizAnalyticsSummary
}

export function AnalyticsDashboard({
  quizzes,
  selectedQuizId,
  summary,
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
          <form className="w-full sm:w-64">
            <Select
              name="quiz"
              defaultValue={selectedQuizId ?? "all"}
              onValueChange={(value) => {
                const url = new URL(window.location.href)
                if (value === "all") {
                  url.searchParams.delete("quiz")
                } else {
                  url.searchParams.set("quiz", value)
                }
                window.location.href = url.toString()
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All quizzes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All quizzes</SelectItem>
                {publishedQuizzes.map((quiz) => (
                  <SelectItem key={quiz.id} value={quiz.id}>
                    {quiz.quiz_title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </form>
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
        <>
          <AnalyticsStats summary={summary} />
          <div className="grid gap-6 lg:grid-cols-2">
            <ActivityChart dailyActivity={summary.dailyActivity} />
            <OutcomeBreakdown outcomeCounts={summary.outcomeCounts} />
          </div>
        </>
      )}
    </div>
  )
}

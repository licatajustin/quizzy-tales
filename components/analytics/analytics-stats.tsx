import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { QuizAnalyticsSummary } from "@/lib/analytics/types"

type AnalyticsStatsProps = {
  summary: QuizAnalyticsSummary
}

export function AnalyticsStats({ summary }: AnalyticsStatsProps) {
  const stats = [
    { label: "Page views", value: summary.views },
    { label: "Quiz starts", value: summary.starts },
    { label: "Completions", value: summary.completions },
    { label: "Completion rate", value: `${summary.completionRate}%` },
    { label: "Shares", value: summary.shares },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {stats.map((stat) => (
        <Card key={stat.label} className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

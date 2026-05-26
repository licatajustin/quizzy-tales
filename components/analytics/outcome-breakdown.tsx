import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { QuizAnalyticsSummary } from "@/lib/analytics/types"

type OutcomeBreakdownProps = {
  outcomeCounts: QuizAnalyticsSummary["outcomeCounts"]
}

export function OutcomeBreakdown({ outcomeCounts }: OutcomeBreakdownProps) {
  const maxCount = Math.max(1, ...outcomeCounts.map((row) => row.count))

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>Outcome distribution</CardTitle>
        <CardDescription>
          Which characters readers got most often.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {outcomeCounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No completed quizzes yet.
          </p>
        ) : (
          <div className="space-y-4">
            {outcomeCounts.map((row) => (
              <div key={row.outcomeId} className="space-y-2">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="font-medium">{row.name}</span>
                  <span className="text-muted-foreground">{row.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(row.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

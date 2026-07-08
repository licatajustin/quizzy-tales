import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { QuizAnalyticsSummary } from "@/lib/analytics/types"

type ActivityChartProps = {
  dailyActivity: QuizAnalyticsSummary["dailyActivity"]
}

function barHeight(value: number, maxValue: number) {
  if (value === 0) {
    return "0%"
  }

  return `${Math.max((value / maxValue) * 100, 12)}%`
}

export function ActivityChart({ dailyActivity }: ActivityChartProps) {
  const maxValue = Math.max(
    1,
    ...dailyActivity.flatMap((day) => [
      day.views,
      day.starts,
      day.completions,
    ])
  )

  const hasActivity = dailyActivity.some(
    (day) => day.views > 0 || day.starts > 0 || day.completions > 0
  )

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>Activity</CardTitle>
        <CardDescription>
          Views, starts, and completions over the last 30 days.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasActivity ? (
          <p className="text-sm text-muted-foreground">
            No activity yet. Share a published quiz to start collecting data.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex h-40 items-end gap-1">
              {dailyActivity.map((day) => (
                <div
                  key={day.date}
                  className="flex min-w-0 flex-1 flex-col items-center gap-2"
                >
                  <div className="flex h-32 w-full items-end justify-center gap-0.5">
                    <div
                      className="w-1.5 rounded-t bg-chart-2"
                      style={{
                        height: barHeight(day.views, maxValue),
                      }}
                      title={`${day.views} views`}
                    />
                    <div
                      className="w-1.5 rounded-t bg-primary/70"
                      style={{
                        height: barHeight(day.starts, maxValue),
                      }}
                      title={`${day.starts} starts`}
                    />
                    <div
                      className="w-1.5 rounded-t bg-muted-foreground/40"
                      style={{
                        height: barHeight(day.completions, maxValue),
                      }}
                      title={`${day.completions} completions`}
                    />
                  </div>
                  <span className="hidden text-[10px] text-muted-foreground sm:block">
                    {day.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-chart-2" />
                Views
              </span>
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-primary/70" />
                Starts
              </span>
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-muted-foreground/40" />
                Completions
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

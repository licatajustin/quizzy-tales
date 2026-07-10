import { AnalyticsMetricsSkeleton } from "@/components/analytics/analytics-metrics-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function AnalyticsLoading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div className="space-y-2">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>
      <Skeleton className="h-10 w-full max-w-xs rounded-lg" />
      <AnalyticsMetricsSkeleton />
    </div>
  )
}

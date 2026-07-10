"use client"

import { useEffect } from "react"

import { RouteStatus } from "@/components/route-status"
import { Button } from "@/components/ui/button"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-12">
      <RouteStatus
        title="Dashboard error"
        description="We couldn't load this page. Your data is safe — try again or head back to the overview."
        primaryHref="/dashboard"
        primaryLabel="Back to dashboard"
      />
      <div className="flex justify-center">
        <Button type="button" variant="outline" className="rounded-full" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  )
}

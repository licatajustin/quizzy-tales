"use client"

import { useEffect } from "react"

import { RouteStatus } from "@/components/route-status"
import { Button } from "@/components/ui/button"

export default function Error({
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
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-6 py-16">
      <RouteStatus
        title="Something went wrong"
        description="An unexpected error occurred. You can try again or return home."
        primaryHref="/"
        primaryLabel="Back to home"
      />
      <Button type="button" variant="outline" className="rounded-full" onClick={reset}>
        Try again
      </Button>
    </div>
  )
}

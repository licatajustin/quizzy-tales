import Link from "next/link"

import { Button } from "@/components/ui/button"

type RouteStatusProps = {
  title: string
  description: string
  primaryHref?: string
  primaryLabel?: string
  secondaryHref?: string
  secondaryLabel?: string
}

export function RouteStatus({
  title,
  description,
  primaryHref = "/",
  primaryLabel = "Back to home",
  secondaryHref,
  secondaryLabel,
}: RouteStatusProps) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <div className="max-w-md space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild className="rounded-full">
          <Link href={primaryHref}>{primaryLabel}</Link>
        </Button>
        {secondaryHref && secondaryLabel ? (
          <Button asChild variant="outline" className="rounded-full">
            <Link href={secondaryHref}>{secondaryLabel}</Link>
          </Button>
        ) : null}
      </div>
    </div>
  )
}

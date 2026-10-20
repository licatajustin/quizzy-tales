import type { OutcomePointShare } from "@/lib/quiz/scoring"
import { cn } from "@/lib/utils"

type OutcomeMixProps = {
  shares: OutcomePointShare[]
}

function segmentTone(index: number) {
  if (index === 0) return "bg-primary"
  if (index === 1) return "bg-foreground/50"
  if (index === 2) return "bg-foreground/35"
  return "bg-foreground/20"
}

export function OutcomeMix({ shares }: OutcomeMixProps) {
  const positiveTotal = shares.reduce(
    (sum, share) => sum + Math.max(0, share.points),
    0
  )

  if (shares.length < 2 || positiveTotal <= 0) {
    return null
  }

  const barShares = shares.filter((share) => share.percent > 0)
  const legend = shares
    .map((share) => `${share.name} ${share.percent}%`)
    .join(" · ")

  return (
    <section className="space-y-3">
      <h2 className="text-center text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
        Your mix
      </h2>
      <div className="flex h-1.5 w-full gap-1" aria-hidden>
        {barShares.map((share, index) => (
          <div
            key={share.id}
            title={`${share.name} ${share.percent}%`}
            className={cn("h-full min-w-1 rounded-full", segmentTone(index))}
            style={{ flex: `${share.percent} 1 0` }}
          />
        ))}
      </div>
      <p className="text-center text-sm leading-relaxed text-pretty text-muted-foreground">
        {legend}
      </p>
    </section>
  )
}

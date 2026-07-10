"use client"

import { cn } from "@/lib/utils"

type ScoreChipsProps = {
  outcomeId: string
  outcomeName: string
  value: number
  onChange: (outcomeId: string, value: number) => void
}

function weightColor(value: number) {
  if (value === 0) {
    return "bg-muted text-muted-foreground hover:bg-muted/80"
  }
  if (value <= 3) {
    return "bg-primary/10 text-foreground hover:bg-primary/15"
  }
  if (value <= 6) {
    return "bg-primary/20 text-foreground hover:bg-primary/25"
  }
  return "bg-primary text-primary-foreground hover:bg-primary/90"
}

export function ScoreChips({
  outcomeId,
  outcomeName,
  value,
  onChange,
}: ScoreChipsProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-foreground">{outcomeName}</p>
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: 11 }, (_, index) => index).map((score) => (
          <button
            key={score}
            type="button"
            aria-label={
              score === 0
                ? `No points toward ${outcomeName}`
                : `Give ${score} point${score === 1 ? "" : "s"} toward ${outcomeName}`
            }
            aria-pressed={value === score}
            onClick={() => onChange(outcomeId, score)}
            className={cn(
              "size-7 rounded-md text-xs font-medium transition-colors",
              value === score
                ? cn(
                    weightColor(score),
                    "ring-2 ring-ring ring-offset-2 ring-offset-background"
                  )
                : weightColor(score)
            )}
          >
            {score}
          </button>
        ))}
      </div>
    </div>
  )
}

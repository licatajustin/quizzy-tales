"use client"

import { useState } from "react"

import { OutcomeResultBody } from "@/components/quiz/outcome-result-body"
import {
  CastCardGrid,
  OutcomeCastCard,
  outcomeCastFrameClass,
  visibleOutcomeLine,
} from "@/components/quiz/outcome-portrait"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { normalizeTagline } from "@/lib/quiz/outcome-details"
import { useQuizThemeAttrs } from "@/components/quiz/quiz-theme-scope"
import type { PublishedOutcome } from "@/lib/quiz/types"
import { cn } from "@/lib/utils"

type ExploreOtherResultsProps = {
  outcomes: PublishedOutcome[]
  winnerId: string
  quizTitle: string
}

function dialogSummary(outcome: PublishedOutcome, quizTitle: string) {
  const tagline = normalizeTagline(outcome.tagline)
  if (tagline) {
    return tagline
  }

  const description = visibleOutcomeLine(outcome.description)
  if (description) {
    return description.length > 160
      ? `${description.slice(0, 157).trimEnd()}…`
      : description
  }

  return `Character result from ${quizTitle}`
}

export function ExploreOtherResults({
  outcomes,
  winnerId,
  quizTitle,
}: ExploreOtherResultsProps) {
  const others = [...outcomes]
    .filter((outcome) => outcome.id !== winnerId)
    .sort((a, b) => a.sort_order - b.sort_order)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [active, setActive] = useState<PublishedOutcome | null>(null)
  const open = selectedId !== null && active !== null
  const themeAttrs = useQuizThemeAttrs()

  if (others.length === 0) {
    return null
  }

  function openOutcome(outcome: PublishedOutcome) {
    setActive(outcome)
    setSelectedId(outcome.id)
  }

  const title = visibleOutcomeLine(active?.name) || "Result"
  const summary = active ? dialogSummary(active, quizTitle) : ""

  return (
    <section
      data-slot="explore-other-results"
      aria-labelledby="explore-other-results-heading"
      className="space-y-4"
    >
      <div className="space-y-1 text-center">
        <h2
          id="explore-other-results-heading"
          className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase"
        >
          Explore the other results
        </h2>
        <p className="text-sm text-muted-foreground">
          Open a character to read their profile.
        </p>
      </div>

      <CastCardGrid count={others.length}>
        {others.map((outcome) => {
          const name = visibleOutcomeLine(outcome.name) || "Result"
          const tagline = normalizeTagline(outcome.tagline)
          const imageUrl = visibleOutcomeLine(outcome.image_url) || null
          const expanded = selectedId === outcome.id

          return (
            <li key={outcome.id} className="min-w-0">
              <button
                type="button"
                className={cn(
                  outcomeCastFrameClass,
                  "flex h-full w-full cursor-pointer flex-col items-stretch p-0 font-sans"
                )}
                aria-haspopup="dialog"
                aria-expanded={expanded}
                aria-label={
                  tagline
                    ? `Open the profile for ${name}: ${tagline}`
                    : `Open the profile for ${name}`
                }
                onClick={() => openOutcome(outcome)}
              >
                <OutcomeCastCard
                  name={name}
                  tagline={tagline}
                  imageUrl={imageUrl}
                />
              </button>
            </li>
          )
        })}
      </CastCardGrid>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) {
            setSelectedId(null)
          }
        }}
      >
        <DialogContent className="gap-0 p-0" {...(themeAttrs ?? {})}>
          {active ? (
            <div className="max-h-[min(92dvh,52rem)] overflow-y-auto overscroll-contain px-5 pt-12 pb-6 sm:px-6">
              <DialogTitle asChild>
                <p className="sr-only">{title}</p>
              </DialogTitle>
              <DialogDescription className="sr-only">
                {summary}
              </DialogDescription>
              <div data-slot="explore-result-profile">
                <OutcomeResultBody
                  outcome={active}
                  quizTitle={quizTitle}
                  eyebrow="Another result"
                  headingLevel="h2"
                  prioritizeImage={false}
                  portraitFallback
                  compact
                />
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  )
}

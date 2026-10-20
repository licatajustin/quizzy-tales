import type { ReactNode } from "react"

import { OutcomeMix } from "@/components/quiz/outcome-mix"
import { OutcomeResultBody } from "@/components/quiz/outcome-result-body"
import { QuizAuthorLogo } from "@/components/quiz/quiz-author-logo"
import type { OutcomePointShare } from "@/lib/quiz/scoring"
import type { PublishedOutcome } from "@/lib/quiz/types"

type QuizResultProps = {
  outcome: PublishedOutcome
  quizTitle: string
  shares: OutcomePointShare[]
  /** Share and retake actions. */
  actions?: ReactNode
  /** Slot below the profile for a "Continue the story" book call to action. */
  continueStory?: ReactNode
  /** Slot below the profile for an "Explore the other results" row. */
  exploreResults?: ReactNode
  /** Slot below the profile for per-result share links. */
  resultShare?: ReactNode
  /** Book and newsletter links, rendered after share and retake. */
  afterActions?: ReactNode
  logoUrl?: string | null
  logoAlt?: string
}

export function QuizResult({
  outcome,
  quizTitle,
  shares,
  actions,
  continueStory,
  exploreResults,
  resultShare,
  afterActions,
  logoUrl,
  logoAlt = "Author logo",
}: QuizResultProps) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-12">
      <QuizAuthorLogo logoUrl={logoUrl} alt={logoAlt} />
      <div data-slot="quiz-result-profile" className="flex flex-col gap-8">
        <OutcomeResultBody outcome={outcome} quizTitle={quizTitle} />
        <OutcomeMix shares={shares} />
      </div>

      {continueStory ? (
        <div data-slot="quiz-result-continue">{continueStory}</div>
      ) : null}
      {exploreResults ? (
        <div data-slot="quiz-result-explore">{exploreResults}</div>
      ) : null}
      {resultShare ? (
        <div data-slot="quiz-result-share-links">{resultShare}</div>
      ) : null}

      {actions ? (
        <div
          data-slot="quiz-result-actions"
          className="flex flex-wrap justify-center gap-3"
        >
          {actions}
        </div>
      ) : null}
      {afterActions ? (
        <div data-slot="quiz-result-links">{afterActions}</div>
      ) : null}
    </div>
  )
}

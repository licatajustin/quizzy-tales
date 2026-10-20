import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { RotateCcw } from "lucide-react"

import { ExploreOtherResults } from "@/components/quiz/explore-other-results"
import { QuizIntroHero } from "@/components/quiz/quiz-intro-hero"
import { QuizPlayer } from "@/components/quiz/quiz-player"
import { QuizResult } from "@/components/quiz/quiz-result"
import { QuizSeoContent } from "@/components/quiz/quiz-seo-content"
import { QuizShareButton } from "@/components/quiz/quiz-share-button"
import { Button } from "@/components/ui/button"
import { resolveQuestionsPerAttempt } from "@/lib/quiz/question-subset"
import { resultSharePath } from "@/lib/quiz/share"
import type { PublishedOutcome } from "@/lib/quiz/types"

import {
  previewQuiz,
  previewShares,
  restoreQuiz,
  sparseOutcome,
  windOutcome,
} from "./fixtures"

export const metadata: Metadata = {
  title: "Result preview",
  robots: { index: false, follow: false },
}

type ResultPreviewPageProps = {
  searchParams: Promise<{ variant?: string }>
}

function PreviewActions({
  outcomeId,
  outcomeName,
  outcomeTagline,
}: {
  outcomeId: string
  outcomeName: string
  outcomeTagline: string
}) {
  return (
    <>
      <QuizShareButton
        quizId="preview"
        sessionId="preview"
        quizTitle={previewQuiz.quiz_title}
        outcomeName={outcomeName}
        outcomeTagline={outcomeTagline}
        resultPath={resultSharePath("preview", outcomeId)}
      />
      <Button type="button" variant="outline" className="rounded-full">
        <RotateCcw data-icon="inline-start" />
        Retake quiz
      </Button>
    </>
  )
}

function PreviewResult({ outcome }: { outcome: PublishedOutcome }) {
  return (
    <QuizResult
      outcome={outcome}
      quizTitle={previewQuiz.quiz_title}
      shares={previewShares}
      actions={
        <PreviewActions
          outcomeId={outcome.id}
          outcomeName={outcome.name || "Result"}
          outcomeTagline={outcome.tagline?.trim() ?? ""}
        />
      }
      exploreResults={
        <ExploreOtherResults
          outcomes={previewQuiz.outcomes}
          winnerId={outcome.id}
          quizTitle={previewQuiz.quiz_title}
        />
      }
    />
  )
}

export default async function ResultPreviewPage({
  searchParams,
}: ResultPreviewPageProps) {
  if (process.env.NODE_ENV === "production") {
    notFound()
  }

  const { variant } = await searchParams
  const questionCount = resolveQuestionsPerAttempt(
    previewQuiz.random_question_subset,
    previewQuiz.questions_per_attempt,
    previewQuiz.questions.length
  )
  const showPlayer = variant === "play" || variant === "restore"
  const showLanding = variant === "landing" || variant === "gallery"

  return (
    <div className="min-h-svh bg-background">
      {showPlayer ? (
        <QuizPlayer
          quizId={variant === "restore" ? "preview-restore" : "preview"}
          slug="preview"
          snapshot={variant === "restore" ? restoreQuiz : previewQuiz}
        />
      ) : null}
      {variant === "landing" ? (
        <QuizPlayer
          quizId="preview-landing"
          slug="preview"
          snapshot={previewQuiz}
        >
          <QuizIntroHero
            snapshot={previewQuiz}
            questionCount={questionCount}
            outcomeCount={previewQuiz.outcomes.length}
          />
        </QuizPlayer>
      ) : null}
      {showPlayer || showLanding ? (
        <QuizSeoContent
          snapshot={variant === "restore" ? restoreQuiz : previewQuiz}
        />
      ) : (
        <PreviewResult
          outcome={variant === "sparse" ? sparseOutcome : windOutcome}
        />
      )}
    </div>
  )
}

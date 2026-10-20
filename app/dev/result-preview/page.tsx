import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { RotateCcw } from "lucide-react"

import { QuizPlayer } from "@/components/quiz/quiz-player"
import { QuizResult } from "@/components/quiz/quiz-result"
import { QuizShareButton } from "@/components/quiz/quiz-share-button"
import { Button } from "@/components/ui/button"
import { resultSharePath } from "@/lib/quiz/share"
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

export default async function ResultPreviewPage({
  searchParams,
}: ResultPreviewPageProps) {
  if (process.env.NODE_ENV === "production") {
    notFound()
  }

  const { variant } = await searchParams

  return (
    <div className="min-h-svh bg-background">
      {variant === "play" || variant === "restore" ? (
        <QuizPlayer
          quizId={variant === "restore" ? "preview-restore" : "preview"}
          slug="preview"
          snapshot={variant === "restore" ? restoreQuiz : previewQuiz}
        />
      ) : (
        <QuizResult
          outcome={variant === "sparse" ? sparseOutcome : windOutcome}
          quizTitle={previewQuiz.quiz_title}
          shares={previewShares}
          actions={
            <PreviewActions
              outcomeId={variant === "sparse" ? "fire" : "wind"}
              outcomeName={variant === "sparse" ? "Fire" : "Wind"}
              outcomeTagline={
                variant === "sparse" ? "" : (windOutcome.tagline ?? "")
              }
            />
          }
        />
      )}
    </div>
  )
}

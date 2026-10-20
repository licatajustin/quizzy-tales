import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { RotateCcw } from "lucide-react"

import { ExploreOtherResults } from "@/components/quiz/explore-other-results"
import { QuizIntroHero } from "@/components/quiz/quiz-intro-hero"
import { QuizPlayer } from "@/components/quiz/quiz-player"
import { QuizResult } from "@/components/quiz/quiz-result"
import { QuizResultShare } from "@/components/quiz/quiz-result-share"
import { QuizSeoContent } from "@/components/quiz/quiz-seo-content"
import { QuizShareButton } from "@/components/quiz/quiz-share-button"
import { QuizThemeScope } from "@/components/quiz/quiz-theme-scope"
import { Button } from "@/components/ui/button"
import { resolveQuestionsPerAttempt } from "@/lib/quiz/question-subset"
import { resultSharePath } from "@/lib/quiz/share"
import type { PublishedOutcome } from "@/lib/quiz/types"

import { EMPTY_QUIZ_THEME, type QuizTheme } from "@/lib/quiz/theme"

import {
  faeLogoUrl,
  previewQuiz,
  previewShares,
  restoreQuiz,
  sparseOutcome,
  themedQuiz,
  windOutcome,
} from "./fixtures"

export const metadata: Metadata = {
  title: "Result preview",
  robots: { index: false, follow: false },
}

type ResultPreviewPageProps = {
  searchParams: Promise<{ variant?: string }>
}

type ContrastScreen = "play" | "result" | "share"

function contrastSnapshot(mode: "dark" | "night" | "custom") {
  const theme: QuizTheme = {
    ...EMPTY_QUIZ_THEME,
    accent: mode === "custom" ? "#e7c27a" : "#d4b483",
    background: mode === "custom" ? "custom" : mode,
    background_color: mode === "custom" ? "#10241c" : null,
    font: mode === "night" ? "story" : mode === "dark" ? "serif" : "modern",
    corners: mode === "night" ? "sharp" : null,
    logo_url: mode === "night" ? faeLogoUrl : null,
  }

  return {
    ...previewQuiz,
    quiz_title: mode === "night" ? "Which Fae Are You?" : previewQuiz.quiz_title,
    book_title: mode === "night" ? "The Fae Court" : previewQuiz.book_title,
    theme,
  }
}

function PreviewActions({
  outcomeId,
  outcomeName,
  outcomeTagline,
  quizTitle,
}: {
  outcomeId: string
  outcomeName: string
  outcomeTagline: string
  quizTitle: string
}) {
  return (
    <>
      <QuizShareButton
        quizId="preview"
        sessionId="preview"
        quizTitle={quizTitle}
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

function PreviewResult({
  outcome,
  quizTitle,
  bookTitle,
  outcomes,
  logoUrl,
}: {
  outcome: PublishedOutcome
  quizTitle: string
  bookTitle: string
  outcomes: PublishedOutcome[]
  logoUrl?: string | null
}) {
  return (
    <QuizResult
      outcome={outcome}
      quizTitle={quizTitle}
      shares={previewShares}
      logoUrl={logoUrl}
      logoAlt={`${bookTitle} logo`}
      actions={
        <PreviewActions
          outcomeId={outcome.id}
          outcomeName={outcome.name || "Result"}
          outcomeTagline={outcome.tagline?.trim() ?? ""}
          quizTitle={quizTitle}
        />
      }
      exploreResults={
        <ExploreOtherResults
          outcomes={outcomes}
          winnerId={outcome.id}
          quizTitle={quizTitle}
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
  const contrast = /^(dark|night|custom)-(play|result|share)$/.exec(variant ?? "")
  if (contrast) {
    const snapshot = contrastSnapshot(contrast[1] as "dark" | "night" | "custom")
    const screen = contrast[2] as ContrastScreen

    return (
      <QuizThemeScope theme={snapshot.theme} className="min-h-svh bg-background">
        {screen === "play" ? (
          <QuizPlayer quizId="preview" slug="preview" snapshot={snapshot} />
        ) : null}
        {screen === "result" ? (
          <PreviewResult
            outcome={windOutcome}
            quizTitle={snapshot.quiz_title}
            bookTitle={snapshot.book_title}
            outcomes={snapshot.outcomes}
            logoUrl={snapshot.theme?.logo_url}
          />
        ) : null}
        {screen === "share" ? (
          <QuizResultShare
            slug="preview"
            snapshot={snapshot}
            outcome={windOutcome}
          />
        ) : null}
      </QuizThemeScope>
    )
  }

  const themed =
    variant === "themed" ||
    variant === "themed-landing" ||
    variant === "themed-play"
  const snapshot =
    variant === "restore" ? restoreQuiz : themed ? themedQuiz : previewQuiz
  const questionCount = resolveQuestionsPerAttempt(
    snapshot.random_question_subset,
    snapshot.questions_per_attempt,
    snapshot.questions.length
  )
  const showPlayer =
    variant === "play" || variant === "restore" || variant === "themed-play"
  const showHero = variant === "landing" || variant === "themed-landing"
  const showSeo =
    showPlayer ||
    showHero ||
    variant === "gallery" ||
    variant === "themed-landing"

  return (
    <QuizThemeScope theme={snapshot.theme} className="min-h-svh bg-background">
      {showPlayer ? (
        <QuizPlayer
          quizId={variant === "restore" ? "preview-restore" : "preview"}
          slug="preview"
          snapshot={snapshot}
        />
      ) : null}
      {showHero ? (
        <QuizPlayer quizId="preview-landing" slug="preview" snapshot={snapshot}>
          <QuizIntroHero
            snapshot={snapshot}
            questionCount={questionCount}
            outcomeCount={snapshot.outcomes.length}
          />
        </QuizPlayer>
      ) : null}
      {showSeo ? (
        <QuizSeoContent snapshot={snapshot} />
      ) : (
        <PreviewResult
          outcome={variant === "sparse" ? sparseOutcome : windOutcome}
          quizTitle={snapshot.quiz_title}
          bookTitle={snapshot.book_title}
          outcomes={snapshot.outcomes}
          logoUrl={snapshot.theme?.logo_url}
        />
      )}
    </QuizThemeScope>
  )
}

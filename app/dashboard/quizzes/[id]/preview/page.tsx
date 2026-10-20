import { notFound } from "next/navigation"
import type { Metadata } from "next"

import { QuizIntroHero } from "@/components/quiz/quiz-intro-hero"
import { QuizPlayer } from "@/components/quiz/quiz-player"
import { QuizThemeScope } from "@/components/quiz/quiz-theme-scope"
import { getAuthorDisplayName } from "@/lib/auth/author"
import { getDashboardSession } from "@/lib/auth/dashboard-session"
import { buildPublishedSnapshot } from "@/lib/quiz/published-snapshot"
import { resolveQuestionsPerAttempt } from "@/lib/quiz/question-subset"
import { getQuizDraft } from "@/lib/quiz/queries"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

type PreviewPageProps = {
  params: Promise<{ id: string }>
}

export default async function QuizPreviewPage({ params }: PreviewPageProps) {
  const { id } = await params
  const { supabase, user } = await getDashboardSession()
  const draft = await getQuizDraft(supabase, id)

  if (!draft || draft.quiz.author_id !== user.id) {
    notFound()
  }

  const authorDisplayName = await getAuthorDisplayName(supabase, user.id)
  const snapshot = buildPublishedSnapshot(draft, { authorDisplayName })

  return (
    <QuizThemeScope theme={snapshot.theme} className="min-h-svh bg-background">
      <QuizPlayer quizId={draft.quiz.id} snapshot={snapshot} isPreview>
        <QuizIntroHero
          snapshot={snapshot}
          questionCount={resolveQuestionsPerAttempt(
            snapshot.random_question_subset,
            snapshot.questions_per_attempt,
            snapshot.questions.length
          )}
          outcomeCount={snapshot.outcomes.length}
          isPreview
        />
      </QuizPlayer>
    </QuizThemeScope>
  )
}

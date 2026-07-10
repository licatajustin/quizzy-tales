import { notFound } from "next/navigation"

import { QuizIntroHero } from "@/components/quiz/quiz-intro-hero"
import { QuizPlayer } from "@/components/quiz/quiz-player"
import { getDashboardSession } from "@/lib/auth/dashboard-session"
import { buildPublishedSnapshot } from "@/lib/quiz/published-snapshot"
import { getQuizDraft } from "@/lib/quiz/queries"

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

  const snapshot = buildPublishedSnapshot(draft)

  return (
    <div className="min-h-svh bg-background">
      <QuizPlayer snapshot={snapshot} isPreview>
        <QuizIntroHero
          snapshot={snapshot}
          questionCount={snapshot.questions.length}
          outcomeCount={snapshot.outcomes.length}
          isPreview
        />
      </QuizPlayer>
    </div>
  )
}

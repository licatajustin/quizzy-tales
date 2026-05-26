import { notFound, redirect } from "next/navigation"

import { QuizPlayer } from "@/components/quiz/quiz-player"
import { buildPublishedSnapshot } from "@/lib/quiz/published-snapshot"
import { getQuizDraft } from "@/lib/quiz/queries"
import { createClient } from "@/lib/supabase/server"

type PreviewPageProps = {
  params: Promise<{ id: string }>
}

export default async function QuizPreviewPage({ params }: PreviewPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const draft = await getQuizDraft(supabase, id)

  if (!draft || draft.quiz.author_id !== user.id) {
    notFound()
  }

  const snapshot = buildPublishedSnapshot(draft)

  return <QuizPlayer snapshot={snapshot} isPreview />
}

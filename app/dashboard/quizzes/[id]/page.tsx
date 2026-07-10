import dynamic from "next/dynamic"
import { notFound } from "next/navigation"

import { getDashboardSession } from "@/lib/auth/dashboard-session"
import { getQuizDraft } from "@/lib/quiz/queries"
import {
  buildPublishedSnapshot,
  hasUnpublishedChanges,
} from "@/lib/quiz/published-snapshot"
import { getSubscriptionAccessForUser } from "@/lib/subscription-server"
import QuizEditorLoading from "./loading"

const QuizEditor = dynamic(
  () =>
    import("@/components/dashboard/quiz-editor/quiz-editor").then(
      (module) => module.QuizEditor
    ),
  { loading: () => <QuizEditorLoading /> }
)

type QuizEditorPageProps = {
  params: Promise<{ id: string }>
}

export default async function QuizEditorPage({ params }: QuizEditorPageProps) {
  const { id } = await params
  const { supabase, user } = await getDashboardSession()

  const draft = await getQuizDraft(supabase, id)

  if (!draft || draft.quiz.author_id !== user.id) {
    notFound()
  }

  const access = await getSubscriptionAccessForUser(supabase, user.id)
  const draftSnapshot = buildPublishedSnapshot(draft)
  const hasLiveChanges = hasUnpublishedChanges(draft.quiz, draftSnapshot)

  if (!access) {
    notFound()
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <QuizEditor
        draft={draft}
        access={access}
        hasLiveChanges={hasLiveChanges}
      />
    </div>
  )
}

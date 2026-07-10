import dynamic from "next/dynamic"
import { notFound } from "next/navigation"

import { CheckoutSyncedToast } from "@/components/checkout/checkout-synced-toast"
import { getDashboardSession } from "@/lib/auth/dashboard-session"
import { syncCheckoutReturnIfNeeded } from "@/lib/billing/checkout-return"
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
  searchParams: Promise<{ billing?: string; session_id?: string }>
}

export default async function QuizEditorPage({
  params,
  searchParams,
}: QuizEditorPageProps) {
  const { id } = await params
  const query = await searchParams
  const { supabase, user } = await getDashboardSession()

  await syncCheckoutReturnIfNeeded(
    user.id,
    query,
    `/dashboard/quizzes/${id}`
  )

  const [draft, access] = await Promise.all([
    getQuizDraft(supabase, id),
    getSubscriptionAccessForUser(supabase, user.id),
  ])

  if (!draft || draft.quiz.author_id !== user.id) {
    notFound()
  }

  const draftSnapshot = buildPublishedSnapshot(draft)
  const hasLiveChanges = hasUnpublishedChanges(draft.quiz, draftSnapshot)

  if (!access) {
    notFound()
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <CheckoutSyncedToast message="Payment complete. Your quiz should be live shortly." />
      <QuizEditor
        draft={draft}
        access={access}
        hasLiveChanges={hasLiveChanges}
      />
    </div>
  )
}

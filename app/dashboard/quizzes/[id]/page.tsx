import { notFound, redirect } from "next/navigation"

import { QuizEditor } from "@/components/dashboard/quiz-editor/quiz-editor"
import { getQuizDraft } from "@/lib/quiz/queries"
import {
  getSubscriptionAccessForUser,
} from "@/lib/subscription-server"
import { createClient } from "@/lib/supabase/server"

type QuizEditorPageProps = {
  params: Promise<{ id: string }>
}

export default async function QuizEditorPage({ params }: QuizEditorPageProps) {
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

  const access = await getSubscriptionAccessForUser(supabase, user.id)

  return (
    <div className="mx-auto w-full max-w-5xl">
      <QuizEditor
        draft={draft}
        canPublish={access?.canPublish ?? false}
      />
    </div>
  )
}

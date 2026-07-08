import { revalidatePath } from "next/cache"
import type { SupabaseClient } from "@supabase/supabase-js"

import {
  buildPublishedSnapshot,
  validateQuizForPublish,
} from "@/lib/quiz/published-snapshot"
import { getQuizDraft } from "@/lib/quiz/queries"

function revalidateQuizPaths(quizId: string, slug?: string) {
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/quizzes")
  revalidatePath(`/dashboard/quizzes/${quizId}`)
  revalidatePath(`/dashboard/quizzes/${quizId}/preview`)
  if (slug) {
    revalidatePath(`/q/${slug}`)
  }
}

export async function executePublishQuiz(
  supabase: SupabaseClient,
  quizId: string
) {
  const draft = await getQuizDraft(supabase, quizId)

  if (!draft) {
    throw new Error("Quiz not found.")
  }

  const errors = validateQuizForPublish(draft)

  if (errors.length > 0) {
    throw new Error(errors.join(" "))
  }

  const snapshot = buildPublishedSnapshot(draft)

  const { error } = await supabase
    .from("quizzes")
    .update({
      status: "published",
      published_snapshot: snapshot,
    })
    .eq("id", quizId)

  if (error) {
    throw new Error(error.message)
  }

  revalidateQuizPaths(quizId, draft.quiz.slug)
  return draft
}

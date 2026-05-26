import type { SupabaseClient } from "@supabase/supabase-js"

import type { QuizDraft } from "@/lib/quiz/types"

export async function getQuizDraft(
  supabase: SupabaseClient,
  quizId: string
): Promise<QuizDraft | null> {
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", quizId)
    .maybeSingle()

  if (quizError || !quiz) {
    return null
  }

  const [{ data: outcomes }, { data: questions }] = await Promise.all([
    supabase
      .from("outcomes")
      .select("*")
      .eq("quiz_id", quizId)
      .order("sort_order"),
    supabase
      .from("questions")
      .select("*")
      .eq("quiz_id", quizId)
      .order("sort_order"),
  ])

  const questionIds = questions?.map((question) => question.id) ?? []
  let answerRows: QuizDraft["answers"] = []

  if (questionIds.length > 0) {
    const { data: fetchedAnswers } = await supabase
      .from("answers")
      .select("*")
      .in("question_id", questionIds)
      .order("sort_order")

    answerRows = fetchedAnswers ?? []
  }

  return {
    quiz,
    outcomes: outcomes ?? [],
    questions: questions ?? [],
    answers: answerRows,
  }
}

export async function getPublishedQuizBySlug(
  supabase: SupabaseClient,
  slug: string
) {
  const { data } = await supabase
    .from("quizzes")
    .select("id, slug, status, published_snapshot")
    .eq("slug", slug)
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  return data
}

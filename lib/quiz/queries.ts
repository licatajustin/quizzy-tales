import type { SupabaseClient } from "@supabase/supabase-js"

import { normalizeIntroText } from "@/lib/quiz/intro-text"
import { normalizeQuizTheme } from "@/lib/quiz/theme"
import {
  normalizeOutcomeDetails,
  normalizeTagline,
} from "@/lib/quiz/outcome-details"
import type { OutcomeRow, QuizDraft } from "@/lib/quiz/types"

export async function getQuizDraft(
  supabase: SupabaseClient,
  quizId: string
): Promise<QuizDraft | null> {
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select(
      "id, author_id, slug, book_title, quiz_title, intro_text, cover_image_url, book_url, newsletter_url, status, random_question_subset, questions_per_attempt, theme, published_snapshot, created_at, updated_at"
    )
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
    quiz: {
      ...quiz,
      random_question_subset: quiz.random_question_subset ?? false,
      questions_per_attempt: quiz.questions_per_attempt ?? null,
      intro_text: normalizeIntroText(quiz.intro_text),
      theme: normalizeQuizTheme(quiz.theme),
      book_url: quiz.book_url ?? null,
      newsletter_url: quiz.newsletter_url ?? null,
    },
    outcomes: (outcomes ?? []).map(mapOutcomeRow),
    questions: questions ?? [],
    answers: answerRows,
  }
}

function mapOutcomeRow(row: {
  id: string
  quiz_id: string
  name: string
  description: string | null
  image_url: string | null
  sort_order: number
  tagline?: string | null
  details?: unknown
}): OutcomeRow {
  return {
    id: row.id,
    quiz_id: row.quiz_id,
    name: row.name,
    description: row.description ?? "",
    image_url: row.image_url,
    sort_order: row.sort_order,
    tagline: normalizeTagline(row.tagline),
    details: normalizeOutcomeDetails(row.details),
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

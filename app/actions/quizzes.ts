"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getQuizDraft } from "@/lib/quiz/queries"
import {
  buildPublishedSnapshot,
  validateQuizForPublish,
} from "@/lib/quiz/published-snapshot"
import { generateSlug } from "@/lib/quiz/slug"
import {
  getAuthorBillingProfile,
  getAuthorQuizCount,
} from "@/lib/subscription-server"
import { getSubscriptionAccess } from "@/lib/subscription"
import { createClient } from "@/lib/supabase/server"

export type ActionResult = {
  error?: string
  success?: boolean
}

async function requireAuthor() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  return { supabase, userId: user.id }
}

async function requireQuizOwner(quizId: string) {
  const { supabase, userId } = await requireAuthor()
  const draft = await getQuizDraft(supabase, quizId)

  if (!draft || draft.quiz.author_id !== userId) {
    throw new Error("Quiz not found")
  }

  return { supabase, userId, draft }
}

async function ensureUniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  authorId: string,
  baseSlug: string,
  excludeQuizId?: string
) {
  let slug = baseSlug || "quiz"
  let counter = 2

  while (true) {
    let query = supabase
      .from("quizzes")
      .select("id")
      .eq("author_id", authorId)
      .eq("slug", slug)

    if (excludeQuizId) {
      query = query.neq("id", excludeQuizId)
    }

    const { data } = await query.maybeSingle()
    if (!data) {
      return slug
    }

    const suffix = `-${counter}`
    slug = `${baseSlug.substring(0, Math.max(1, 50 - suffix.length))}${suffix}`
    counter += 1
  }
}

function revalidateQuizPaths(quizId: string, slug?: string) {
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/quizzes")
  revalidatePath(`/dashboard/quizzes/${quizId}`)
  revalidatePath(`/dashboard/quizzes/${quizId}/preview`)
  if (slug) {
    revalidatePath(`/q/${slug}`)
  }
}

export async function createQuiz(formData: FormData) {
  const { supabase, userId } = await requireAuthor()
  const author = await getAuthorBillingProfile(supabase, userId)

  if (!author) {
    return { error: "Author profile not found." }
  }

  const quizCount = await getAuthorQuizCount(supabase, userId)
  const access = getSubscriptionAccess(author, quizCount)

  if (!access.canCreateQuiz) {
    return {
      error: "Free plan includes 1 quiz. Upgrade to Pro to create more.",
    }
  }

  const bookTitle = String(formData.get("book_title") ?? "").trim()
  const quizTitle = String(formData.get("quiz_title") ?? "").trim()
  const slugInput = String(formData.get("slug") ?? "").trim()
  const baseSlug = generateSlug(slugInput || bookTitle || quizTitle)

  if (!bookTitle || !quizTitle) {
    return { error: "Book title and quiz title are required." }
  }

  const slug = await ensureUniqueSlug(supabase, userId, baseSlug)

  const { data: quiz, error } = await supabase
    .from("quizzes")
    .insert({
      author_id: userId,
      book_title: bookTitle,
      quiz_title: quizTitle,
      slug,
      status: "draft",
    })
    .select("id")
    .single()

  if (error || !quiz) {
    return { error: error?.message ?? "Could not create quiz." }
  }

  revalidateQuizPaths(quiz.id, slug)
  redirect(`/dashboard/quizzes/${quiz.id}`)
}

export async function updateQuizDetails(
  quizId: string,
  input: {
    book_title: string
    quiz_title: string
    slug: string
    cover_image_url: string | null
  }
): Promise<ActionResult> {
  const { supabase, draft } = await requireQuizOwner(quizId)

  const bookTitle = input.book_title.trim()
  const quizTitle = input.quiz_title.trim()
  const slug = generateSlug(input.slug.trim() || bookTitle)

  if (!bookTitle || !quizTitle || !slug) {
    return { error: "Book title, quiz title, and slug are required." }
  }

  const uniqueSlug = await ensureUniqueSlug(
    supabase,
    draft.quiz.author_id,
    slug,
    quizId
  )

  const { error } = await supabase
    .from("quizzes")
    .update({
      book_title: bookTitle,
      quiz_title: quizTitle,
      slug: uniqueSlug,
      cover_image_url: input.cover_image_url?.trim() || null,
    })
    .eq("id", quizId)

  if (error) {
    return { error: error.message }
  }

  revalidateQuizPaths(quizId, uniqueSlug)
  return { success: true }
}

export async function deleteQuiz(quizId: string): Promise<ActionResult> {
  const { supabase, draft } = await requireQuizOwner(quizId)

  const { error } = await supabase.from("quizzes").delete().eq("id", quizId)

  if (error) {
    return { error: error.message }
  }

  revalidateQuizPaths(quizId, draft.quiz.slug)
  return { success: true }
}

export async function createOutcome(
  quizId: string,
  input: { name: string; description?: string }
): Promise<ActionResult & { id?: string }> {
  const { supabase, draft } = await requireQuizOwner(quizId)

  const name = input.name.trim()
  if (!name) {
    return { error: "Outcome name is required." }
  }

  const sortOrder =
    draft.outcomes.length > 0
      ? Math.max(...draft.outcomes.map((outcome) => outcome.sort_order)) + 1
      : 0

  const { data: outcome, error } = await supabase
    .from("outcomes")
    .insert({
      quiz_id: quizId,
      name,
      description: input.description?.trim() ?? "",
      sort_order: sortOrder,
    })
    .select("id")
    .single()

  if (error || !outcome) {
    return { error: error?.message ?? "Could not create outcome." }
  }

  for (const answer of draft.answers) {
    await supabase
      .from("answers")
      .update({
        weights: { ...answer.weights, [outcome.id]: 0 },
      })
      .eq("id", answer.id)
  }

  revalidateQuizPaths(quizId, draft.quiz.slug)
  return { success: true, id: outcome.id }
}

export async function updateOutcome(
  outcomeId: string,
  input: {
    name: string
    description: string
    image_url: string | null
  }
): Promise<ActionResult> {
  const { supabase } = await requireAuthor()

  const { data: outcome } = await supabase
    .from("outcomes")
    .select("quiz_id")
    .eq("id", outcomeId)
    .maybeSingle()

  if (!outcome) {
    return { error: "Outcome not found." }
  }

  await requireQuizOwner(outcome.quiz_id)

  const { error } = await supabase
    .from("outcomes")
    .update({
      name: input.name.trim(),
      description: input.description.trim(),
      image_url: input.image_url?.trim() || null,
    })
    .eq("id", outcomeId)

  if (error) {
    return { error: error.message }
  }

  revalidateQuizPaths(outcome.quiz_id)
  return { success: true }
}

export async function deleteOutcome(outcomeId: string): Promise<ActionResult> {
  const { supabase } = await requireAuthor()

  const { data: outcome } = await supabase
    .from("outcomes")
    .select("quiz_id")
    .eq("id", outcomeId)
    .maybeSingle()

  if (!outcome) {
    return { error: "Outcome not found." }
  }

  const { draft } = await requireQuizOwner(outcome.quiz_id)

  const { error } = await supabase.from("outcomes").delete().eq("id", outcomeId)

  if (error) {
    return { error: error.message }
  }

  const answers = draft.answers.filter((answer) =>
    Object.prototype.hasOwnProperty.call(answer.weights, outcomeId)
  )

  for (const answer of answers) {
    const nextWeights = { ...answer.weights }
    delete nextWeights[outcomeId]
    await supabase
      .from("answers")
      .update({ weights: nextWeights })
      .eq("id", answer.id)
  }

  revalidateQuizPaths(outcome.quiz_id, draft.quiz.slug)
  return { success: true }
}

export async function createQuestion(quizId: string): Promise<
  ActionResult & { id?: string }
> {
  const { supabase, draft } = await requireQuizOwner(quizId)

  const sortOrder =
    draft.questions.length > 0
      ? Math.max(...draft.questions.map((question) => question.sort_order)) + 1
      : 0

  const { data: question, error } = await supabase
    .from("questions")
    .insert({
      quiz_id: quizId,
      question_text: "New question",
      sort_order: sortOrder,
    })
    .select("id")
    .single()

  if (error || !question) {
    return { error: error?.message ?? "Could not create question." }
  }

  const defaultWeights = Object.fromEntries(
    draft.outcomes.map((outcome) => [outcome.id, 0])
  )

  await supabase.from("answers").insert([
    {
      question_id: question.id,
      answer_text: "Answer A",
      weights: defaultWeights,
      sort_order: 0,
    },
    {
      question_id: question.id,
      answer_text: "Answer B",
      weights: defaultWeights,
      sort_order: 1,
    },
  ])

  revalidateQuizPaths(quizId, draft.quiz.slug)
  return { success: true, id: question.id }
}

export async function updateQuestion(
  questionId: string,
  input: {
    question_text: string
    allow_multiple: boolean
  }
): Promise<ActionResult> {
  const { supabase } = await requireAuthor()

  const { data: question } = await supabase
    .from("questions")
    .select("quiz_id")
    .eq("id", questionId)
    .maybeSingle()

  if (!question) {
    return { error: "Question not found." }
  }

  await requireQuizOwner(question.quiz_id)

  const { error } = await supabase
    .from("questions")
    .update({
      question_text: input.question_text.trim(),
      allow_multiple: input.allow_multiple,
    })
    .eq("id", questionId)

  if (error) {
    return { error: error.message }
  }

  revalidateQuizPaths(question.quiz_id)
  return { success: true }
}

export async function deleteQuestion(questionId: string): Promise<ActionResult> {
  const { supabase } = await requireAuthor()

  const { data: question } = await supabase
    .from("questions")
    .select("quiz_id")
    .eq("id", questionId)
    .maybeSingle()

  if (!question) {
    return { error: "Question not found." }
  }

  const { draft } = await requireQuizOwner(question.quiz_id)

  const { error } = await supabase.from("questions").delete().eq("id", questionId)

  if (error) {
    return { error: error.message }
  }

  revalidateQuizPaths(question.quiz_id, draft.quiz.slug)
  return { success: true }
}

export async function createAnswer(
  questionId: string
): Promise<ActionResult & { id?: string }> {
  const { supabase } = await requireAuthor()

  const { data: question } = await supabase
    .from("questions")
    .select("quiz_id")
    .eq("id", questionId)
    .maybeSingle()

  if (!question) {
    return { error: "Question not found." }
  }

  const { draft } = await requireQuizOwner(question.quiz_id)
  const answers = draft.answers.filter(
    (answer) => answer.question_id === questionId
  )
  const sortOrder =
    answers.length > 0
      ? Math.max(...answers.map((answer) => answer.sort_order)) + 1
      : 0

  const defaultWeights = Object.fromEntries(
    draft.outcomes.map((outcome) => [outcome.id, 0])
  )

  const { data: answer, error } = await supabase
    .from("answers")
    .insert({
      question_id: questionId,
      answer_text: "New answer",
      weights: defaultWeights,
      sort_order: sortOrder,
    })
    .select("id")
    .single()

  if (error || !answer) {
    return { error: error?.message ?? "Could not create answer." }
  }

  revalidateQuizPaths(question.quiz_id, draft.quiz.slug)
  return { success: true, id: answer.id }
}

export async function updateAnswer(
  answerId: string,
  input: {
    answer_text: string
    weights?: Record<string, number>
  }
): Promise<ActionResult> {
  const { supabase } = await requireAuthor()

  const { data: answer } = await supabase
    .from("answers")
    .select("question_id")
    .eq("id", answerId)
    .maybeSingle()

  if (!answer) {
    return { error: "Answer not found." }
  }

  const { data: question } = await supabase
    .from("questions")
    .select("quiz_id")
    .eq("id", answer.question_id)
    .maybeSingle()

  if (!question) {
    return { error: "Question not found." }
  }

  await requireQuizOwner(question.quiz_id)

  const payload: {
    answer_text: string
    weights?: Record<string, number>
  } = {
    answer_text: input.answer_text.trim(),
  }

  if (input.weights) {
    payload.weights = input.weights
  }

  const { error } = await supabase
    .from("answers")
    .update(payload)
    .eq("id", answerId)

  if (error) {
    return { error: error.message }
  }

  revalidateQuizPaths(question.quiz_id)
  return { success: true }
}

export async function deleteAnswer(answerId: string): Promise<ActionResult> {
  const { supabase } = await requireAuthor()

  const { data: answer } = await supabase
    .from("answers")
    .select("question_id")
    .eq("id", answerId)
    .maybeSingle()

  if (!answer) {
    return { error: "Answer not found." }
  }

  const { data: question } = await supabase
    .from("questions")
    .select("quiz_id")
    .eq("id", answer.question_id)
    .maybeSingle()

  if (!question) {
    return { error: "Question not found." }
  }

  const { draft } = await requireQuizOwner(question.quiz_id)

  const { error } = await supabase.from("answers").delete().eq("id", answerId)

  if (error) {
    return { error: error.message }
  }

  revalidateQuizPaths(question.quiz_id, draft.quiz.slug)
  return { success: true }
}

export async function publishQuiz(quizId: string): Promise<ActionResult> {
  const { supabase, draft } = await requireQuizOwner(quizId)
  const author = await getAuthorBillingProfile(supabase, draft.quiz.author_id)

  if (!author) {
    return { error: "Author profile not found." }
  }

  const quizCount = await getAuthorQuizCount(supabase, draft.quiz.author_id)
  const access = getSubscriptionAccess(author, quizCount)

  if (!access.canPublish) {
    return { error: "Upgrade to Pro to publish quizzes." }
  }

  const errors = validateQuizForPublish(draft)

  if (errors.length > 0) {
    return { error: errors.join(" ") }
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
    return { error: error.message }
  }

  revalidateQuizPaths(quizId, draft.quiz.slug)
  return { success: true }
}

export async function unpublishQuiz(quizId: string): Promise<ActionResult> {
  const { supabase, draft } = await requireQuizOwner(quizId)

  const { error } = await supabase
    .from("quizzes")
    .update({ status: "draft" })
    .eq("id", quizId)

  if (error) {
    return { error: error.message }
  }

  revalidateQuizPaths(quizId, draft.quiz.slug)
  return { success: true }
}

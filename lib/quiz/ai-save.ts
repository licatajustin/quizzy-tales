import type { SupabaseClient } from "@supabase/supabase-js"

import type { GeneratedQuiz, QuizRevisionPatch } from "@/lib/ai/schemas"
import { resolveBuilderImageUrl } from "@/lib/quiz/builder/images"
import type { QuizBuilderDraft } from "@/lib/quiz/builder/types"
import { builderDraftToGeneratedQuiz } from "@/lib/quiz/builder/types"
import { generateSlug } from "@/lib/quiz/slug"

async function ensureUniqueSlug(
  supabase: SupabaseClient,
  authorId: string,
  baseSlug: string
) {
  let slug = baseSlug || "quiz"
  let counter = 2

  while (true) {
    const { data } = await supabase
      .from("quizzes")
      .select("id")
      .eq("author_id", authorId)
      .eq("slug", slug)
      .maybeSingle()

    if (!data) {
      return slug
    }

    const suffix = `-${counter}`
    slug = `${baseSlug.substring(0, Math.max(1, 50 - suffix.length))}${suffix}`
    counter += 1
  }
}

export async function saveGeneratedQuiz(
  supabase: SupabaseClient,
  authorId: string,
  input: {
    bookTitle: string
    generated: GeneratedQuiz
    slug?: string
  }
) {
  const baseSlug = generateSlug(input.slug ?? input.bookTitle)
  const slug = await ensureUniqueSlug(supabase, authorId, baseSlug)

  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .insert({
      author_id: authorId,
      book_title: input.bookTitle.trim(),
      quiz_title: input.generated.quiz_title.trim(),
      slug,
      status: "draft",
    })
    .select("id")
    .single()

  if (quizError || !quiz) {
    throw new Error(quizError?.message ?? "Could not create quiz.")
  }

  const outcomeIdMap = new Map<string, string>()

  for (const [index, outcome] of input.generated.outcomes.entries()) {
    const { data: row, error } = await supabase
      .from("outcomes")
      .insert({
        quiz_id: quiz.id,
        name: outcome.name.trim(),
        description: outcome.description.trim(),
        sort_order: index,
      })
      .select("id")
      .single()

    if (error || !row) {
      throw new Error(error?.message ?? "Could not create outcome.")
    }

    outcomeIdMap.set(outcome.id, row.id)
  }

  for (const [questionIndex, question] of input.generated.questions.entries()) {
    const { data: questionRow, error: questionError } = await supabase
      .from("questions")
      .insert({
        quiz_id: quiz.id,
        question_text: question.question_text.trim(),
        allow_multiple: question.allow_multiple,
        sort_order: questionIndex,
      })
      .select("id")
      .single()

    if (questionError || !questionRow) {
      throw new Error(questionError?.message ?? "Could not create question.")
    }

    const answerRows = question.answers.map((answer, answerIndex) => {
      const weights = Object.fromEntries(
        answer.weights.map((weight) => [
          outcomeIdMap.get(weight.outcome_id) ?? weight.outcome_id,
          weight.value,
        ])
      )

      for (const dbOutcomeId of outcomeIdMap.values()) {
        if (!(dbOutcomeId in weights)) {
          weights[dbOutcomeId] = 0
        }
      }

      return {
        question_id: questionRow.id,
        answer_text: answer.answer_text.trim(),
        weights,
        sort_order: answerIndex,
      }
    })

    const { error: answersError } = await supabase.from("answers").insert(answerRows)

    if (answersError) {
      throw new Error(answersError.message)
    }
  }

  return { quizId: quiz.id, slug }
}

export async function saveBuilderQuiz(
  supabase: SupabaseClient,
  authorId: string,
  draft: QuizBuilderDraft,
  slug?: string
) {
  const generated = builderDraftToGeneratedQuiz(draft)
  const baseSlug = generateSlug(slug ?? (draft.book_title || draft.quiz_title))
  const uniqueSlug = await ensureUniqueSlug(supabase, authorId, baseSlug)

  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .insert({
      author_id: authorId,
      book_title: draft.book_title.trim(),
      quiz_title: draft.quiz_title.trim(),
      slug: uniqueSlug,
      status: "draft",
      cover_image_url: null,
    })
    .select("id")
    .single()

  if (quizError || !quiz) {
    throw new Error(quizError?.message ?? "Could not create quiz.")
  }

  const coverImageUrl = await resolveBuilderImageUrl(
    supabase,
    authorId,
    quiz.id,
    draft.cover_image_url
  )

  if (coverImageUrl) {
    await supabase
      .from("quizzes")
      .update({ cover_image_url: coverImageUrl })
      .eq("id", quiz.id)
  }

  const outcomeIdMap = new Map<string, string>()

  for (const [index, outcome] of draft.outcomes.entries()) {
    const tempId = generated.outcomes[index]?.id ?? outcome.id
    const imageUrl = await resolveBuilderImageUrl(
      supabase,
      authorId,
      quiz.id,
      outcome.image_url,
      tempId
    )

    const { data: row, error } = await supabase
      .from("outcomes")
      .insert({
        quiz_id: quiz.id,
        name: outcome.name.trim(),
        description: outcome.description.trim(),
        image_url: imageUrl,
        sort_order: index,
      })
      .select("id")
      .single()

    if (error || !row) {
      throw new Error(error?.message ?? "Could not create outcome.")
    }

    outcomeIdMap.set(tempId, row.id)
  }

  for (const [questionIndex, question] of generated.questions.entries()) {
    const { data: questionRow, error: questionError } = await supabase
      .from("questions")
      .insert({
        quiz_id: quiz.id,
        question_text: question.question_text.trim(),
        allow_multiple: question.allow_multiple,
        sort_order: questionIndex,
      })
      .select("id")
      .single()

    if (questionError || !questionRow) {
      throw new Error(questionError?.message ?? "Could not create question.")
    }

    const answerRows = question.answers.map((answer, answerIndex) => {
      const weights = Object.fromEntries(
        answer.weights.map((weight) => [
          outcomeIdMap.get(weight.outcome_id) ?? weight.outcome_id,
          weight.value,
        ])
      )

      for (const dbOutcomeId of outcomeIdMap.values()) {
        if (!(dbOutcomeId in weights)) {
          weights[dbOutcomeId] = 0
        }
      }

      return {
        question_id: questionRow.id,
        answer_text: answer.answer_text.trim(),
        weights,
        sort_order: answerIndex,
      }
    })

    const { error: answersError } = await supabase.from("answers").insert(answerRows)

    if (answersError) {
      throw new Error(answersError.message)
    }
  }

  return { quizId: quiz.id, slug: uniqueSlug }
}

export function draftToAiRevisionContext(draft: {
  quiz: { quiz_title: string; book_title: string }
  outcomes: Array<{ id: string; name: string; description: string }>
  questions: Array<{
    id: string
    question_text: string
    allow_multiple: boolean
  }>
  answers: Array<{
    question_id: string
    answer_text: string
    weights: Record<string, number>
  }>
}) {
  const answersByQuestion = draft.answers.reduce<
    Record<string, typeof draft.answers>
  >((acc, answer) => {
    acc[answer.question_id] ??= []
    acc[answer.question_id].push(answer)
    return acc
  }, {})

  const outcomeIdToTemp = new Map(
    draft.outcomes.map((outcome, index) => [outcome.id, `outcome_${index + 1}`])
  )

  return {
    quiz_title: draft.quiz.quiz_title,
    book_title: draft.quiz.book_title,
    outcomes: draft.outcomes.map((outcome, index) => ({
      id: `outcome_${index + 1}`,
      name: outcome.name,
      description: outcome.description,
    })),
    questions: draft.questions.map((question) => ({
      question_text: question.question_text,
      allow_multiple: question.allow_multiple,
      answers: (answersByQuestion[question.id] ?? []).map((answer) => ({
        answer_text: answer.answer_text,
        weights: Object.entries(answer.weights).map(([outcomeId, value]) => ({
          outcome_id: outcomeIdToTemp.get(outcomeId) ?? outcomeId,
          value,
        })),
      })),
    })),
  }
}

function normalizeOutcomeName(name: string) {
  return name.trim().toLowerCase()
}

function buildOutcomeImageLookup(
  existingOutcomes: Array<{
    name: string
    image_url: string | null
    sort_order: number
  }>
) {
  const imageByTempId = new Map<string, string>()
  const imageByName = new Map<string, string>()

  const sorted = [...existingOutcomes].sort(
    (a, b) => a.sort_order - b.sort_order
  )

  for (const [index, outcome] of sorted.entries()) {
    if (!outcome.image_url) {
      continue
    }

    imageByTempId.set(`outcome_${index + 1}`, outcome.image_url)
    imageByName.set(normalizeOutcomeName(outcome.name), outcome.image_url)
  }

  return { imageByTempId, imageByName }
}

function resolvePreservedOutcomeImage(
  outcome: GeneratedQuiz["outcomes"][number],
  lookup: ReturnType<typeof buildOutcomeImageLookup>
) {
  return (
    lookup.imageByTempId.get(outcome.id) ??
    lookup.imageByName.get(normalizeOutcomeName(outcome.name)) ??
    null
  )
}

async function replaceQuizContent(
  supabase: SupabaseClient,
  quizId: string,
  generated: Pick<GeneratedQuiz, "outcomes" | "questions">
) {
  const { data: existingOutcomes } = await supabase
    .from("outcomes")
    .select("name, image_url, sort_order")
    .eq("quiz_id", quizId)

  const outcomeImageLookup = buildOutcomeImageLookup(existingOutcomes ?? [])

  const { data: questions } = await supabase
    .from("questions")
    .select("id")
    .eq("quiz_id", quizId)

  const questionIds = (questions ?? []).map((question) => question.id)

  if (questionIds.length > 0) {
    await supabase.from("answers").delete().in("question_id", questionIds)
  }

  await supabase.from("questions").delete().eq("quiz_id", quizId)
  await supabase.from("outcomes").delete().eq("quiz_id", quizId)

  const outcomeIdMap = new Map<string, string>()

  for (const [index, outcome] of generated.outcomes.entries()) {
    const { data: row, error } = await supabase
      .from("outcomes")
      .insert({
        quiz_id: quizId,
        name: outcome.name.trim(),
        description: outcome.description.trim(),
        image_url: resolvePreservedOutcomeImage(outcome, outcomeImageLookup),
        sort_order: index,
      })
      .select("id")
      .single()

    if (error || !row) {
      throw new Error(error?.message ?? "Could not update outcome.")
    }

    outcomeIdMap.set(outcome.id, row.id)
  }

  for (const [questionIndex, question] of generated.questions.entries()) {
    const { data: questionRow, error: questionError } = await supabase
      .from("questions")
      .insert({
        quiz_id: quizId,
        question_text: question.question_text.trim(),
        allow_multiple: question.allow_multiple,
        sort_order: questionIndex,
      })
      .select("id")
      .single()

    if (questionError || !questionRow) {
      throw new Error(questionError?.message ?? "Could not update question.")
    }

    const answerRows = question.answers.map((answer, answerIndex) => {
      const weights = Object.fromEntries(
        answer.weights.map((weight) => [
          outcomeIdMap.get(weight.outcome_id) ?? weight.outcome_id,
          weight.value,
        ])
      )

      for (const dbOutcomeId of outcomeIdMap.values()) {
        if (!(dbOutcomeId in weights)) {
          weights[dbOutcomeId] = 0
        }
      }

      return {
        question_id: questionRow.id,
        answer_text: answer.answer_text.trim(),
        weights,
        sort_order: answerIndex,
      }
    })

    const { error: answersError } = await supabase.from("answers").insert(answerRows)

    if (answersError) {
      throw new Error(answersError.message)
    }
  }
}

export async function applyQuizRevisionPatch(
  supabase: SupabaseClient,
  quizId: string,
  patch: QuizRevisionPatch
) {
  if (patch.quiz_title.trim()) {
    const { error } = await supabase
      .from("quizzes")
      .update({ quiz_title: patch.quiz_title.trim() })
      .eq("id", quizId)

    if (error) {
      throw new Error(error.message)
    }
  }

  if (patch.outcomes.length > 0 && patch.questions.length > 0) {
    await replaceQuizContent(supabase, quizId, {
      outcomes: patch.outcomes,
      questions: patch.questions,
    })
  } else if (patch.outcomes.length > 0 || patch.questions.length > 0) {
    throw new Error(
      "Content updates must include both outcomes and questions."
    )
  }
}

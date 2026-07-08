import { z } from "zod"

import type { QuizBuilderDraft } from "@/lib/quiz/builder/types"

const weightEntrySchema = z.object({
  outcome_id: z.string(),
  value: z.number().min(0).max(10),
})

const builderOutcomeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  image_url: z.string(),
})

const builderAnswerAiSchema = z.object({
  id: z.string(),
  answer_text: z.string(),
  weights: z.array(weightEntrySchema),
})

const builderAnswerClientSchema = z.object({
  id: z.string(),
  answer_text: z.string(),
  weights: z.record(z.string(), z.number()),
})

const builderQuestionAiSchema = z.object({
  id: z.string(),
  question_text: z.string(),
  allow_multiple: z.boolean(),
  answers: z.array(builderAnswerAiSchema),
})

const builderQuestionClientSchema = z.object({
  id: z.string(),
  question_text: z.string(),
  allow_multiple: z.boolean(),
  answers: z.array(builderAnswerClientSchema),
})

export const quizBuilderDraftAiSchema = z.object({
  book_title: z.string(),
  quiz_title: z.string(),
  cover_image_url: z.string(),
  outcomes: z.array(builderOutcomeSchema),
  questions: z.array(builderQuestionAiSchema),
})

export const quizBuilderDraftClientSchema = z.object({
  book_title: z.string(),
  quiz_title: z.string(),
  cover_image_url: z.string(),
  outcomes: z.array(builderOutcomeSchema),
  questions: z.array(builderQuestionClientSchema),
})

export const quizBuilderChatResponseSchema = z.object({
  message: z.string(),
  suggestions: z.array(z.string()),
  draft: quizBuilderDraftAiSchema,
})

export type QuizBuilderChatResponse = z.infer<
  typeof quizBuilderChatResponseSchema
>

export const quizBuilderChatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ),
  draft: quizBuilderDraftClientSchema,
})

function weightsArrayToRecord(
  weights: z.infer<typeof weightEntrySchema>[],
  outcomeIds: string[]
) {
  const record = Object.fromEntries(
    weights.map((weight) => [weight.outcome_id, weight.value])
  )

  for (const outcomeId of outcomeIds) {
    if (!(outcomeId in record)) {
      record[outcomeId] = 0
    }
  }

  return record
}

export const BUILDER_UPLOADED_IMAGE_MARKER = "[UPLOADED_BY_USER]"

export function summarizeImageUrlForAi(url: string) {
  const trimmed = url.trim()
  if (!trimmed) {
    return ""
  }

  if (trimmed.startsWith("data:")) {
    return BUILDER_UPLOADED_IMAGE_MARKER
  }

  return trimmed
}

function preserveClientImageUrl(clientUrl: string, aiUrl: string) {
  const ai = aiUrl.trim()
  const client = clientUrl.trim()

  if (ai === BUILDER_UPLOADED_IMAGE_MARKER || (!ai && client)) {
    return client
  }

  if (ai) {
    return ai
  }

  return ""
}

export function mergeBuilderDraftWithClientImages(
  clientDraft: QuizBuilderDraft,
  aiDraft: z.infer<typeof quizBuilderDraftAiSchema>
): QuizBuilderDraft {
  const normalized = normalizeBuilderDraft(aiDraft)

  return {
    ...normalized,
    cover_image_url: preserveClientImageUrl(
      clientDraft.cover_image_url,
      normalized.cover_image_url
    ),
    outcomes: normalized.outcomes.map((outcome) => {
      const clientOutcome = clientDraft.outcomes.find(
        (entry) => entry.id === outcome.id
      )

      return {
        ...outcome,
        image_url: preserveClientImageUrl(
          clientOutcome?.image_url ?? "",
          outcome.image_url
        ),
      }
    }),
  }
}

export function draftToAiFormat(draft: QuizBuilderDraft) {
  return {
    book_title: draft.book_title,
    quiz_title: draft.quiz_title,
    cover_image_url: summarizeImageUrlForAi(draft.cover_image_url),
    outcomes: draft.outcomes.map((outcome) => ({
      ...outcome,
      image_url: summarizeImageUrlForAi(outcome.image_url),
    })),
    questions: draft.questions.map((question) => ({
      id: question.id,
      question_text: question.question_text,
      allow_multiple: question.allow_multiple,
      answers: question.answers.map((answer) => ({
        id: answer.id,
        answer_text: answer.answer_text,
        weights: draft.outcomes.map((outcome) => ({
          outcome_id: outcome.id,
          value: answer.weights[outcome.id] ?? 0,
        })),
      })),
    })),
  }
}

export function normalizeBuilderDraft(
  draft: z.infer<typeof quizBuilderDraftAiSchema>
): QuizBuilderDraft {
  const outcomes = draft.outcomes.map((outcome, index) => ({
    id: outcome.id.trim() || `outcome_${index + 1}`,
    name: outcome.name.trim(),
    description: outcome.description.trim(),
    image_url: outcome.image_url.trim(),
  }))

  const outcomeIds = outcomes.map((outcome) => outcome.id)

  return {
    book_title: draft.book_title.trim(),
    quiz_title: draft.quiz_title.trim(),
    cover_image_url: draft.cover_image_url.trim(),
    outcomes,
    questions: draft.questions.map((question, qIndex) => ({
      id: question.id.trim() || `question_${qIndex + 1}`,
      question_text: question.question_text.trim(),
      allow_multiple: question.allow_multiple,
      answers: question.answers.map((answer, aIndex) => ({
        id: answer.id.trim() || `answer_${qIndex + 1}_${aIndex + 1}`,
        answer_text: answer.answer_text.trim(),
        weights: weightsArrayToRecord(answer.weights, outcomeIds),
      })),
    })),
  }
}

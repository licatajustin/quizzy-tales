import { normalizeIntroText } from "@/lib/quiz/intro-text"
import {
  normalizeOutcomeDetails,
  normalizeTagline,
} from "@/lib/quiz/outcome-details"
import { normalizeQuizTheme } from "@/lib/quiz/theme"
import {
  comparableReaderLinkFields,
  snapshotReaderLinks,
} from "@/lib/quiz/reader-links"
import type {
  AnswerRow,
  PublishedOutcome,
  PublishedQuizSnapshot,
  QuizDraft,
  QuizRow,
} from "@/lib/quiz/types"

export function buildPublishedSnapshot(
  draft: QuizDraft,
  extras?: { authorDisplayName?: string | null }
): PublishedQuizSnapshot {
  const answersByQuestion = draft.answers.reduce<Record<string, AnswerRow[]>>(
    (acc, answer) => {
      acc[answer.question_id] ??= []
      acc[answer.question_id].push(answer)
      return acc
    },
    {}
  )

  const readerLinks = snapshotReaderLinks({
    book_url: draft.quiz.book_url,
    newsletter_url: draft.quiz.newsletter_url,
    author_display_name: extras?.authorDisplayName,
  })

  return {
    quiz_title: draft.quiz.quiz_title,
    book_title: draft.quiz.book_title,
    intro_text: normalizeIntroText(draft.quiz.intro_text),
    cover_image_url: draft.quiz.cover_image_url,
    book_url: readerLinks.bookUrl,
    newsletter_url: readerLinks.newsletterUrl,
    author_display_name: readerLinks.authorDisplayName,
    theme: normalizeQuizTheme(draft.quiz.theme),
    outcomes: [...draft.outcomes]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((outcome) => ({
        id: outcome.id,
        name: outcome.name,
        description: outcome.description,
        image_url: outcome.image_url,
        sort_order: outcome.sort_order,
        tagline: normalizeTagline(outcome.tagline),
        details: normalizeOutcomeDetails(outcome.details),
      })),
    questions: [...draft.questions]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((question) => ({
        id: question.id,
        question_text: question.question_text,
        allow_multiple: question.allow_multiple,
        sort_order: question.sort_order,
        answers: [...(answersByQuestion[question.id] ?? [])]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((answer) => ({
            id: answer.id,
            answer_text: answer.answer_text,
            weights: answer.weights,
            sort_order: answer.sort_order,
          })),
      })),
    random_question_subset: draft.quiz.random_question_subset,
    questions_per_attempt: draft.quiz.questions_per_attempt,
    published_at: new Date().toISOString(),
  }
}

function comparableOutcome(outcome: PublishedOutcome) {
  return {
    id: outcome.id,
    name: outcome.name,
    description: outcome.description,
    image_url: outcome.image_url,
    sort_order: outcome.sort_order,
    tagline: normalizeTagline(outcome.tagline),
    details: normalizeOutcomeDetails(outcome.details),
  }
}

export function normalizePublishedSnapshot(
  snapshot: PublishedQuizSnapshot
): PublishedQuizSnapshot {
  return {
    ...snapshot,
    intro_text: normalizeIntroText(snapshot.intro_text),
    theme: normalizeQuizTheme(snapshot.theme),
    outcomes: snapshot.outcomes.map((outcome) => ({
      ...outcome,
      tagline: normalizeTagline(outcome.tagline),
      details: normalizeOutcomeDetails(outcome.details),
    })),
  }
}

function comparableSnapshot(snapshot: PublishedQuizSnapshot) {
  return {
    quiz_title: snapshot.quiz_title,
    book_title: snapshot.book_title,
    intro_text: normalizeIntroText(snapshot.intro_text),
    cover_image_url: snapshot.cover_image_url,
    ...comparableReaderLinkFields(snapshot),
    outcomes: snapshot.outcomes.map(comparableOutcome),
    questions: snapshot.questions,
    random_question_subset: snapshot.random_question_subset ?? false,
    questions_per_attempt: snapshot.questions_per_attempt ?? null,
    theme: normalizeQuizTheme(snapshot.theme),
  }
}

export type QuizPublishValidation = {
  errors: string[]
  warnings: string[]
}

export function validateQuizForPublish(
  draft: QuizDraft
): QuizPublishValidation {
  const errors: string[] = []
  const warnings: string[] = []

  if (draft.outcomes.length < 2) {
    errors.push("Add at least 2 character outcomes.")
  }

  if (draft.questions.length < 3) {
    errors.push("Add at least 3 questions.")
  }

  for (const question of draft.questions) {
    const answers = draft.answers.filter(
      (answer) => answer.question_id === question.id
    )
    if (answers.length < 2) {
      errors.push(
        `Question "${question.question_text}" needs at least 2 answers.`
      )
    }
  }

  if (!draft.quiz.slug.trim()) {
    errors.push("Quiz slug is required.")
  }

  if (!draft.quiz.quiz_title.trim() || !draft.quiz.book_title.trim()) {
    errors.push("Book title and quiz title are required.")
  }

  const thinOutcomes = draft.outcomes.filter(
    (outcome) => !outcome.description.trim()
  )
  if (thinOutcomes.length === 1) {
    const name = thinOutcomes[0]?.name.trim() || "One outcome"
    warnings.push(
      `"${name}" has no description, so its result page will be thin.`
    )
  } else if (thinOutcomes.length > 1) {
    warnings.push(
      `${thinOutcomes.length} outcomes have no description, so their result pages will be thin.`
    )
  }

  if (!draft.quiz.cover_image_url?.trim()) {
    warnings.push("This quiz has no cover image.")
  }

  return { errors, warnings }
}

export function buildCoverImageQuizUpdate(
  quiz: {
    status: QuizRow["status"]
    published_snapshot: PublishedQuizSnapshot | null
  },
  coverImageUrl: string | null
) {
  const update: {
    cover_image_url: string | null
    published_snapshot?: PublishedQuizSnapshot
  } = {
    cover_image_url: coverImageUrl,
  }

  if (quiz.status === "published" && quiz.published_snapshot) {
    update.published_snapshot = {
      ...quiz.published_snapshot,
      cover_image_url: coverImageUrl,
    }
  }

  return update
}

export function hasUnpublishedChanges(
  quiz: QuizRow,
  draftSnapshot: PublishedQuizSnapshot
) {
  if (!quiz.published_snapshot) {
    return true
  }

  return (
    JSON.stringify(comparableSnapshot(draftSnapshot)) !==
    JSON.stringify(comparableSnapshot(quiz.published_snapshot))
  )
}

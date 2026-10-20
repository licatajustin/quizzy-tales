import type {
  AnswerRow,
  PublishedQuizSnapshot,
  QuizDraft,
  QuizRow,
} from "@/lib/quiz/types"

export function buildPublishedSnapshot(
  draft: QuizDraft
): PublishedQuizSnapshot {
  const answersByQuestion = draft.answers.reduce<Record<string, AnswerRow[]>>(
    (acc, answer) => {
      acc[answer.question_id] ??= []
      acc[answer.question_id].push(answer)
      return acc
    },
    {}
  )

  return {
    quiz_title: draft.quiz.quiz_title,
    book_title: draft.quiz.book_title,
    cover_image_url: draft.quiz.cover_image_url,
    outcomes: [...draft.outcomes]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((outcome) => ({
        id: outcome.id,
        name: outcome.name,
        description: outcome.description,
        image_url: outcome.image_url,
        sort_order: outcome.sort_order,
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

function comparableSnapshot(snapshot: PublishedQuizSnapshot) {
  return {
    quiz_title: snapshot.quiz_title,
    book_title: snapshot.book_title,
    cover_image_url: snapshot.cover_image_url,
    outcomes: snapshot.outcomes,
    questions: snapshot.questions,
    random_question_subset: snapshot.random_question_subset ?? false,
    questions_per_attempt: snapshot.questions_per_attempt ?? null,
  }
}

export function validateQuizForPublish(draft: QuizDraft) {
  const errors: string[] = []

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

  return errors
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

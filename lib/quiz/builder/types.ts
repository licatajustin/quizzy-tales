export type BuilderOutcome = {
  id: string
  name: string
  description: string
  image_url: string
}

export type BuilderAnswer = {
  id: string
  answer_text: string
  weights: Record<string, number>
}

export type BuilderQuestion = {
  id: string
  question_text: string
  allow_multiple: boolean
  answers: BuilderAnswer[]
}

export type QuizBuilderDraft = {
  book_title: string
  quiz_title: string
  cover_image_url: string
  outcomes: BuilderOutcome[]
  questions: BuilderQuestion[]
}

export type BuilderChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
}

export function createEmptyBuilderDraft(): QuizBuilderDraft {
  return {
    book_title: "",
    quiz_title: "",
    cover_image_url: "",
    outcomes: [],
    questions: [],
  }
}

export function getBuilderMissingFields(draft: QuizBuilderDraft) {
  const missing: string[] = []

  if (!draft.quiz_title.trim()) {
    missing.push("Quiz title")
  }

  if (!draft.book_title.trim()) {
    missing.push("Book title")
  }

  if (draft.outcomes.length < 2) {
    missing.push(`Outcomes (${draft.outcomes.length}/2 minimum)`)
  } else {
    for (const outcome of draft.outcomes) {
      if (!outcome.name.trim()) {
        missing.push("Outcome names")
        break
      }
      if (!outcome.description.trim()) {
        missing.push("Outcome descriptions")
        break
      }
    }
  }

  if (draft.questions.length < 3) {
    missing.push(`Questions (${draft.questions.length}/3 minimum)`)
  } else {
    for (const question of draft.questions) {
      const answers = question.answers
      if (answers.length < 2) {
        missing.push("At least 2 answers per question")
        break
      }
      for (const answer of answers) {
        const hasWeight = draft.outcomes.some(
          (outcome) => (answer.weights[outcome.id] ?? 0) > 0
        )
        if (!hasWeight && draft.outcomes.length > 0) {
          missing.push("Scoring weights for every question")
          break
        }
      }
    }
  }

  return [...new Set(missing)]
}

export function isBuilderDraftValid(draft: QuizBuilderDraft) {
  return getBuilderMissingFields(draft).length === 0
}

export function getBuilderProgress(draft: QuizBuilderDraft) {
  const sections = [
    Boolean(draft.quiz_title.trim()),
    Boolean(draft.book_title.trim()),
    draft.outcomes.length >= 2 &&
      draft.outcomes.every(
        (outcome) => outcome.name.trim() && outcome.description.trim()
      ),
    draft.questions.length >= 3 &&
      draft.questions.every((question) => question.answers.length >= 2),
  ]

  const complete = sections.filter(Boolean).length
  return { complete, total: sections.length }
}

export function builderDraftToGeneratedQuiz(draft: QuizBuilderDraft) {
  return {
    quiz_title: draft.quiz_title.trim(),
    outcomes: draft.outcomes.map((outcome) => ({
      id: outcome.id,
      name: outcome.name.trim(),
      description: outcome.description.trim(),
    })),
    questions: draft.questions.map((question) => ({
      question_text: question.question_text.trim(),
      allow_multiple: question.allow_multiple,
      answers: question.answers.map((answer) => ({
        answer_text: answer.answer_text.trim(),
        weights: draft.outcomes.map((outcome) => ({
          outcome_id: outcome.id,
          value: answer.weights[outcome.id] ?? 0,
        })),
      })),
    })),
  }
}

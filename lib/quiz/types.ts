export type QuizStatus = "draft" | "published"

export type PublishedQuizSnapshot = {
  quiz_title: string
  book_title: string
  cover_image_url: string | null
  outcomes: {
    id: string
    name: string
    description: string
    image_url: string | null
    sort_order: number
  }[]
  questions: {
    id: string
    question_text: string
    allow_multiple: boolean
    sort_order: number
    answers: {
      id: string
      answer_text: string
      weights: Record<string, number>
      sort_order: number
    }[]
  }[]
  published_at: string
}

export type QuizRow = {
  id: string
  author_id: string
  slug: string
  book_title: string
  quiz_title: string
  cover_image_url: string | null
  status: QuizStatus
  published_snapshot: PublishedQuizSnapshot | null
  created_at: string
  updated_at: string
}

export type OutcomeRow = {
  id: string
  quiz_id: string
  name: string
  description: string
  image_url: string | null
  sort_order: number
}

export type QuestionRow = {
  id: string
  quiz_id: string
  question_text: string
  allow_multiple: boolean
  sort_order: number
}

export type AnswerRow = {
  id: string
  question_id: string
  answer_text: string
  weights: Record<string, number>
  sort_order: number
}

export type QuizDraft = {
  quiz: QuizRow
  outcomes: OutcomeRow[]
  questions: QuestionRow[]
  answers: AnswerRow[]
}

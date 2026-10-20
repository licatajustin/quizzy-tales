import type { OutcomeDetailSection } from "@/lib/quiz/outcome-details"
import type { QuizTheme } from "@/lib/quiz/theme"

export type QuizStatus = "draft" | "published"

export type PublishedOutcome = {
  id: string
  name: string
  description: string
  image_url: string | null
  sort_order: number
  tagline?: string
  details?: OutcomeDetailSection[]
}

export type PublishedQuizSnapshot = {
  quiz_title: string
  book_title: string
  intro_text?: string | null
  cover_image_url: string | null
  book_url?: string | null
  newsletter_url?: string | null
  author_display_name?: string | null
  theme?: QuizTheme
  outcomes: PublishedOutcome[]
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
  random_question_subset?: boolean
  questions_per_attempt?: number | null
  published_at: string
}

export const QUIZ_LIST_SELECT =
  "id, slug, book_title, quiz_title, status, updated_at" as const

export type QuizListItem = Pick<
  QuizRow,
  "id" | "slug" | "book_title" | "quiz_title" | "status" | "updated_at"
>

export type QuizRow = {
  id: string
  author_id: string
  slug: string
  book_title: string
  quiz_title: string
  intro_text: string | null
  cover_image_url: string | null
  book_url: string | null
  newsletter_url: string | null
  status: QuizStatus
  random_question_subset: boolean
  questions_per_attempt: number | null
  theme: QuizTheme
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
  tagline: string
  details: OutcomeDetailSection[]
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

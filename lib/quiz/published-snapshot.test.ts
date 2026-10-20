import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  buildPublishedSnapshot,
  hasUnpublishedChanges,
} from "./published-snapshot.ts"
import type { PublishedQuizSnapshot, QuizDraft, QuizRow } from "./types.ts"

function draft(overrides: Partial<QuizRow> = {}): QuizDraft {
  const quiz: QuizRow = {
    id: "quiz-1",
    author_id: "author-1",
    slug: "sample",
    book_title: "Sample Book",
    quiz_title: "Which character are you?",
    intro_text: null,
    cover_image_url: null,
    book_url: null,
    newsletter_url: null,
    status: "published",
    random_question_subset: false,
    questions_per_attempt: null,
    published_snapshot: null,
    created_at: "2026-10-20T00:00:00.000Z",
    updated_at: "2026-10-20T00:00:00.000Z",
    ...overrides,
  }

  return {
    quiz,
    outcomes: [
      {
        id: "outcome-1",
        quiz_id: quiz.id,
        name: "Ada",
        description: "A maker",
        image_url: null,
        sort_order: 0,
        tagline: "",
        details: [],
      },
      {
        id: "outcome-2",
        quiz_id: quiz.id,
        name: "Bea",
        description: "A reader",
        image_url: null,
        sort_order: 1,
        tagline: "",
        details: [],
      },
    ],
    questions: [
      {
        id: "question-1",
        quiz_id: quiz.id,
        question_text: "First?",
        allow_multiple: false,
        sort_order: 0,
      },
      {
        id: "question-2",
        quiz_id: quiz.id,
        question_text: "Second?",
        allow_multiple: false,
        sort_order: 1,
      },
      {
        id: "question-3",
        quiz_id: quiz.id,
        question_text: "Third?",
        allow_multiple: false,
        sort_order: 2,
      },
    ],
    answers: [],
  }
}

function withoutReaderFields(
  snapshot: PublishedQuizSnapshot
): PublishedQuizSnapshot {
  const oldSnapshot = { ...snapshot }
  delete oldSnapshot.book_url
  delete oldSnapshot.newsletter_url
  delete oldSnapshot.author_display_name
  return oldSnapshot
}

describe("buildPublishedSnapshot reader links", () => {
  it("copies valid links and the author name into the snapshot", () => {
    const snapshot = buildPublishedSnapshot(
      draft({
        book_url: "https://www.amazon.com/dp/123",
        newsletter_url: "https://author.example/news",
      }),
      { authorDisplayName: " Ada Quinn " }
    )

    assert.equal(snapshot.book_url, "https://www.amazon.com/dp/123")
    assert.equal(snapshot.newsletter_url, "https://author.example/news")
    assert.equal(snapshot.author_display_name, "Ada Quinn")
  })

  it("leaves unsafe links out of the snapshot", () => {
    const snapshot = buildPublishedSnapshot(
      draft({
        book_url: "javascript:alert(1)",
        newsletter_url: "newsletter.example",
      })
    )

    assert.equal(snapshot.book_url, null)
    assert.equal(snapshot.newsletter_url, null)
    assert.equal(snapshot.author_display_name, null)
  })
})

describe("hasUnpublishedChanges reader links", () => {
  it("does not flag an old snapshot that has no reader link fields", () => {
    const next = buildPublishedSnapshot(draft())
    const published = withoutReaderFields(next)
    const quiz = draft({ published_snapshot: published }).quiz

    assert.equal(hasUnpublishedChanges(quiz, next), false)
  })

  it("flags a book link that is not in the live snapshot yet", () => {
    const published = withoutReaderFields(buildPublishedSnapshot(draft()))
    const next = buildPublishedSnapshot(
      draft({ book_url: "https://www.amazon.com/dp/123" })
    )
    const quiz = draft({
      book_url: "https://www.amazon.com/dp/123",
      published_snapshot: published,
    }).quiz

    assert.equal(hasUnpublishedChanges(quiz, next), true)
  })

  it("ignores an author name that only exists on one snapshot", () => {
    const published = buildPublishedSnapshot(draft(), {
      authorDisplayName: "Ada Quinn",
    })
    const next = buildPublishedSnapshot(draft())
    const quiz = draft({ published_snapshot: published }).quiz

    assert.equal(hasUnpublishedChanges(quiz, next), false)
  })
})

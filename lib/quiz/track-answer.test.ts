import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { recordTrackedAnswers } from "./track-answer.ts"

const sessionId = "11111111-1111-4111-8111-111111111111"
const quizId = "22222222-2222-4222-8222-222222222222"
const questionId = "33333333-3333-4333-8333-333333333333"
const answerA = "44444444-4444-4444-8444-444444444444"
const answerB = "55555555-5555-4555-8555-555555555555"
const answerC = "66666666-6666-4666-8666-666666666666"

function quiz(allowMultiple: boolean) {
  return {
    published_snapshot: {
      quiz_title: "Which Fae Are You?",
      book_title: "The Fae Court",
      cover_image_url: null,
      outcomes: [],
      questions: [
        {
          id: questionId,
          question_text: "Which fae call to you?",
          allow_multiple: allowMultiple,
          sort_order: 0,
          answers: [
            {
              id: answerA,
              answer_text: "Threshold",
              weights: {},
              sort_order: 0,
            },
            {
              id: answerB,
              answer_text: "Hearth",
              weights: {},
              sort_order: 1,
            },
            {
              id: answerC,
              answer_text: "Thorn",
              weights: {},
              sort_order: 2,
            },
          ],
        },
      ],
      published_at: "2026-10-20T00:00:00.000Z",
    },
  }
}

function adminFor(allowMultiple: boolean) {
  const inserted: unknown[] = []

  const admin = {
    from(table: string) {
      const builder = {
        select() {
          return builder
        },
        eq() {
          return builder
        },
        delete() {
          return builder
        },
        insert(rows: unknown) {
          inserted.push(rows)
          return Promise.resolve({ error: null })
        },
        async maybeSingle() {
          if (table === "reader_sessions") {
            return { data: { quiz_id: quizId }, error: null }
          }

          if (table === "quizzes") {
            return { data: quiz(allowMultiple), error: null }
          }

          return { data: null, error: null }
        },
        then(
          resolve: (value: { error: null }) => unknown,
          reject?: (reason: unknown) => unknown
        ) {
          return Promise.resolve({ error: null }).then(resolve, reject)
        },
      }

      return builder
    },
  }

  return { admin, inserted }
}

describe("track answer route", () => {
  it("rejects more than two picks on a multiple-answer question", async () => {
    const { admin, inserted } = adminFor(true)
    const result = await recordTrackedAnswers(admin, {
      sessionId,
      questionId,
      answerIds: [answerA, answerB, answerC],
    })

    assert.deepEqual(result, {
      error: "This question accepts up to 2 answers.",
    })
    assert.deepEqual(inserted, [])
  })

  it("rejects more than one pick on a single-answer question", async () => {
    const { admin, inserted } = adminFor(false)
    const result = await recordTrackedAnswers(admin, {
      sessionId,
      questionId,
      answerIds: [answerA, answerB],
    })

    assert.deepEqual(result, { error: "This question accepts one answer." })
    assert.deepEqual(inserted, [])
  })

  it("records two picks when the live question allows them", async () => {
    const { admin, inserted } = adminFor(true)
    const result = await recordTrackedAnswers(admin, {
      sessionId,
      questionId,
      answerIds: [answerA, answerB],
    })

    assert.deepEqual(result, { ok: true })
    assert.equal(inserted.length, 1)
  })
})

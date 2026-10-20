import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  buildPublishedSnapshot,
  hasUnpublishedChanges,
  normalizePublishedSnapshot,
  validateQuizForPublish,
} from "./published-snapshot.ts"
import {
  coerceSectionKind,
  detailSectionToGenerated,
  mergeGeneratedProfile,
  normalizeOutcomeDetails,
  sectionsFromGenerated,
  visibleOutcomeDetails,
} from "./outcome-details.ts"
import type { QuizDraft } from "./types.ts"

function draft(overrides: Partial<QuizDraft> = {}): QuizDraft {
  const base: QuizDraft = {
    quiz: {
      id: "quiz-1",
      author_id: "author-1",
      slug: "fae-quiz",
      book_title: "The Book",
      quiz_title: "Which one are you?",
      cover_image_url: "https://example.com/cover.jpg",
      book_url: null,
      newsletter_url: null,
      status: "draft",
      random_question_subset: false,
      questions_per_attempt: null,
      published_snapshot: null,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    },
    outcomes: [
      {
        id: "o1",
        quiz_id: "quiz-1",
        name: "Ada",
        description: "Ada keeps the peace.",
        image_url: null,
        sort_order: 0,
        tagline: "",
        details: [],
      },
      {
        id: "o2",
        quiz_id: "quiz-1",
        name: "Bea",
        description: "Bea starts the trouble.",
        image_url: null,
        sort_order: 1,
        tagline: "",
        details: [],
      },
    ],
    questions: [0, 1, 2].map((index) => ({
      id: `q${index}`,
      quiz_id: "quiz-1",
      question_text: `Question ${index}`,
      allow_multiple: false,
      sort_order: index,
    })),
    answers: [0, 1, 2].flatMap((questionIndex) =>
      [0, 1].map((answerIndex) => ({
        id: `a${questionIndex}${answerIndex}`,
        question_id: `q${questionIndex}`,
        answer_text: `Answer ${answerIndex}`,
        weights: { o1: 1, o2: 0 },
        sort_order: answerIndex,
      }))
    ),
  }

  return {
    ...base,
    ...overrides,
    quiz: { ...base.quiz, ...overrides.quiz },
    outcomes: overrides.outcomes ?? base.outcomes,
    questions: overrides.questions ?? base.questions,
    answers: overrides.answers ?? base.answers,
  }
}

describe("normalizeOutcomeDetails", () => {
  it("drops missing and invalid sections", () => {
    assert.deepEqual(normalizeOutcomeDetails(undefined), [])
    assert.deepEqual(normalizeOutcomeDetails({ label: "Nope" }), [])
    assert.deepEqual(
      normalizeOutcomeDetails([
        { label: "Mood", kind: "poem", value: "soft" },
        null,
        "chips",
      ]),
      []
    )
  })

  it("keeps text, bullets, and chips in order", () => {
    assert.deepEqual(
      normalizeOutcomeDetails([
        { label: " Core Essence ", kind: "text", text: " Salt and tide. " },
        { label: "Strengths", kind: "bullets", items: [" Keeps watch ", ""] },
        { label: "Colors", kind: "chips", value: ["sea glass", "ink"] },
      ]),
      [
        { label: "Core Essence", kind: "text", value: "Salt and tide." },
        { label: "Strengths", kind: "bullets", value: ["Keeps watch"] },
        { label: "Colors", kind: "chips", value: ["sea glass", "ink"] },
      ]
    )
  })

  it("splits a newline string into list items", () => {
    assert.deepEqual(
      sectionsFromGenerated([
        { label: "Notes", kind: "bullets", value: "Pack light\nAsk first" },
      ]),
      [{ label: "Notes", kind: "bullets", value: ["Pack light", "Ask first"] }]
    )
  })

  it("hides sections with no visible value", () => {
    assert.deepEqual(
      visibleOutcomeDetails([
        { label: "Empty", kind: "text", value: "   " },
        { label: "Also empty", kind: "chips", items: ["", "  "] },
        { label: "Vibe", kind: "text", value: "Warm" },
      ]),
      [{ label: "Vibe", kind: "text", value: "Warm" }]
    )
  })
})

describe("profile conversion", () => {
  it("round-trips a stored section through the builder shape", () => {
    const stored = [
      { label: "Love style", kind: "text" as const, value: "Steady." },
      {
        label: "Familiars",
        kind: "chips" as const,
        value: ["heron", "moth"],
      },
    ]

    assert.deepEqual(
      sectionsFromGenerated(stored.map(detailSectionToGenerated)),
      stored
    )
  })

  it("turns a paragraph into bullets when the kind changes", () => {
    assert.deepEqual(
      coerceSectionKind(
        { label: "Notes", kind: "text", value: "Pack light\nAsk first" },
        "bullets"
      ),
      { label: "Notes", kind: "bullets", value: ["Pack light", "Ask first"] }
    )
  })

  it("keeps an existing summary when the new one is blank", () => {
    assert.deepEqual(
      mergeGeneratedProfile(
        {
          description: "Already written.",
          tagline: "The Keeper",
          details: [{ label: "Vibe", kind: "text", value: "Calm" }],
        },
        { description: "  ", tagline: "", details: [] }
      ),
      {
        description: "Already written.",
        tagline: "The Keeper",
        details: [{ label: "Vibe", kind: "text", value: "Calm" }],
      }
    )
  })
})

describe("published snapshots", () => {
  it("fills tagline and details when an older snapshot lacks them", () => {
    const snapshot = normalizePublishedSnapshot({
      quiz_title: "Quiz",
      book_title: "Book",
      cover_image_url: null,
      outcomes: [
        {
          id: "o1",
          name: "Ada",
          description: "",
          image_url: null,
          sort_order: 0,
        },
      ],
      questions: [],
      published_at: "2026-01-01T00:00:00.000Z",
    })

    assert.equal(snapshot.outcomes[0]?.tagline, "")
    assert.deepEqual(snapshot.outcomes[0]?.details, [])
  })

  it("does not treat a missing profile as an unpublished change", () => {
    const current = draft()
    const published = buildPublishedSnapshot(current)
    const legacy = {
      ...published,
      outcomes: published.outcomes.map((outcome) => ({
        id: outcome.id,
        name: outcome.name,
        description: outcome.description,
        image_url: outcome.image_url,
        sort_order: outcome.sort_order,
      })),
    }

    assert.equal(
      hasUnpublishedChanges(
        { ...current.quiz, published_snapshot: legacy },
        buildPublishedSnapshot(current)
      ),
      false
    )
  })
})

describe("validateQuizForPublish", () => {
  it("warns on a thin result or a missing cover without blocking", () => {
    const ready = validateQuizForPublish(draft())
    assert.deepEqual(ready.errors, [])
    assert.deepEqual(ready.warnings, [])

    const thin = validateQuizForPublish(
      draft({
        quiz: { cover_image_url: null } as QuizDraft["quiz"],
        outcomes: draft().outcomes.map((outcome, index) =>
          index === 0 ? { ...outcome, description: "  " } : outcome
        ),
      })
    )

    assert.deepEqual(thin.errors, [])
    assert.deepEqual(thin.warnings, [
      '"Ada" has no description, so its result page will be thin.',
      "This quiz has no cover image.",
    ])
  })

  it("still blocks a quiz that is missing questions", () => {
    const result = validateQuizForPublish(draft({ questions: [], answers: [] }))
    assert.ok(result.errors.some((error) => error.includes("3 questions")))
  })
})

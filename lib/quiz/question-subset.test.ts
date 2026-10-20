import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { calculateWinningOutcome } from "./scoring.ts"
import {
  attemptRestoreBootstrapScript,
  attemptStorageKey,
  fisherYatesShuffle,
  formatQuestionCount,
  parseStoredQuizAttempt,
  pickRandomQuestions,
  quizProgressPercent,
  resolvePersistedQuestions,
  resolveQuestionsPerAttempt,
  selectionForShownQuestions,
  serializeStoredQuizAttempt,
  subsetExceedsPool,
  validateQuestionsPerAttemptInput,
} from "./question-subset.ts"

const questions = [{ id: "q1" }, { id: "q2" }, { id: "q3" }, { id: "q4" }]

describe("resolveQuestionsPerAttempt", () => {
  it("shows the full pool when the setting is off", () => {
    assert.equal(resolveQuestionsPerAttempt(false, 2, 4), 4)
    assert.equal(resolveQuestionsPerAttempt(undefined, 2, 4), 4)
    assert.equal(resolveQuestionsPerAttempt(null, null, 4), 4)
  })

  it("uses N when it is inside the pool", () => {
    assert.equal(resolveQuestionsPerAttempt(true, 2, 4), 2)
    assert.equal(resolveQuestionsPerAttempt(true, 1, 4), 1)
  })

  it("shows every question when N is missing or larger than the pool", () => {
    assert.equal(resolveQuestionsPerAttempt(true, null, 4), 4)
    assert.equal(resolveQuestionsPerAttempt(true, 0, 4), 4)
    assert.equal(resolveQuestionsPerAttempt(true, 8, 5), 5)
    assert.equal(resolveQuestionsPerAttempt(true, 1.5, 4), 4)
  })
})

describe("fisherYatesShuffle", () => {
  it("does not mutate the input", () => {
    const pool = ["a", "b", "c"]
    fisherYatesShuffle(pool, () => 0)
    assert.deepEqual(pool, ["a", "b", "c"])
  })

  it("follows Fisher-Yates swaps for a seeded random source", () => {
    const shuffled = fisherYatesShuffle(["a", "b", "c", "d"], () => 0)
    assert.deepEqual(shuffled, ["b", "c", "d", "a"])
  })

  it("keeps the original order when every roll stays put", () => {
    const shuffled = fisherYatesShuffle(["a", "b", "c", "d"], () => 0.999)
    assert.deepEqual(shuffled, ["a", "b", "c", "d"])
  })
})

describe("pickRandomQuestions", () => {
  it("takes the first N questions after an unbiased shuffle", () => {
    const picked = pickRandomQuestions(questions, 2, () => 0)
    assert.deepEqual(
      picked.map((question) => question.id),
      ["q2", "q3"]
    )
  })

  it("returns the full pool in its original order when N covers every question", () => {
    const picked = pickRandomQuestions(questions, 4, () => 0)
    assert.deepEqual(
      picked.map((question) => question.id),
      ["q1", "q2", "q3", "q4"]
    )
    assert.notEqual(picked, questions)
  })
})

describe("resolvePersistedQuestions", () => {
  it("restores the saved ids in the saved order", () => {
    const resolved = resolvePersistedQuestions(questions, ["q4", "q1"], 2)
    assert.deepEqual(
      resolved?.map((question) => question.id),
      ["q4", "q1"]
    )
  })

  it("rejects a saved set that no longer matches the pool or N", () => {
    assert.equal(
      resolvePersistedQuestions(questions, ["q1", "missing"], 2),
      null
    )
    assert.equal(resolvePersistedQuestions(questions, ["q1"], 2), null)
    assert.equal(resolvePersistedQuestions(questions, ["q1", "q1"], 2), null)
    assert.equal(
      resolvePersistedQuestions(questions, ["q1", "q2", "q3"], 2),
      null
    )
  })
})

describe("selectionForShownQuestions", () => {
  it("drops answers for questions that were not shown", () => {
    const shown = questions.slice(0, 1).map((question) => ({
      ...question,
      answers: [{ id: `${question.id}-a` }],
    }))
    const selection = selectionForShownQuestions(shown, {
      q1: ["q1-a", "other"],
      q2: ["q2-a"],
    })

    assert.deepEqual(selection.selectedByQuestion, { q1: ["q1-a"] })
    assert.deepEqual(selection.answerIds, ["q1-a"])
  })

  it("orders answers by shown question order, oldest first", () => {
    const selection = selectionForShownQuestions(
      [
        { id: "q1", answers: [{ id: "a1" }] },
        { id: "q2", answers: [{ id: "a2" }] },
      ],
      { q2: ["a2"], q1: ["a1"] }
    )

    assert.deepEqual(selection.answerIds, ["a1", "a2"])
    assert.deepEqual(Object.keys(selection.selectedByQuestion), ["q1", "q2"])
  })

  it("lets scoring ignore a high-weight answer from a hidden question", () => {
    const outcomes = [
      {
        id: "hero",
        quiz_id: "quiz",
        name: "Hero",
        description: "",
        image_url: null,
        sort_order: 0,
      },
      {
        id: "villain",
        quiz_id: "quiz",
        name: "Villain",
        description: "",
        image_url: null,
        sort_order: 1,
      },
    ]
    const shown = selectionForShownQuestions(
      [{ id: "q1", answers: [{ id: "a1" }] }],
      { q1: ["a1"], q2: ["a2"] }
    )
    const winner = calculateWinningOutcome(outcomes, shown.answerIds, [
      { id: "a1", weights: { hero: 1 } },
      { id: "a2", weights: { villain: 100 } },
    ])

    assert.equal(winner?.id, "hero")
  })
})

describe("attempt storage", () => {
  it("round-trips an in-progress attempt and rejects corrupt payloads", () => {
    const attempt = {
      questionIds: ["q2", "q3"],
      selectedByQuestion: { q2: ["a"] },
      questionIndex: 1,
      state: "playing" as const,
    }
    const parsed = parseStoredQuizAttempt(serializeStoredQuizAttempt(attempt))
    assert.deepEqual(parsed, attempt)
    assert.equal(parseStoredQuizAttempt("{"), null)
    assert.equal(
      parseStoredQuizAttempt(JSON.stringify({ questionIds: [] })),
      null
    )
    assert.equal(attemptStorageKey("quiz-1", false), "quizzy:attempt:quiz-1")
    assert.equal(
      attemptStorageKey("quiz-1", true),
      "quizzy:attempt:preview:quiz-1"
    )
  })
})

describe("quiz progress", () => {
  it("starts at 0% and reaches 100% only when every question is answered", () => {
    assert.equal(quizProgressPercent(0, 6), 0)
    assert.equal(quizProgressPercent(1, 6), (1 / 6) * 100)
    assert.equal(quizProgressPercent(5, 6), (5 / 6) * 100)
    assert.equal(quizProgressPercent(6, 6), 100)
    assert.equal(quizProgressPercent(0, 0), 0)
  })
})

describe("attempt restore bootstrap", () => {
  it("hides the intro only when a saved attempt exists", () => {
    const script = attemptRestoreBootstrapScript("quizzy:attempt:quiz-1")
    assert.match(script, /localStorage\.getItem\("quizzy:attempt:quiz-1"\)/)
    assert.match(script, /data-quiz-attempt/)
    assert.equal(script.includes("</script>"), false)
    assert.equal(
      attemptRestoreBootstrapScript("a</script>").includes("</script>"),
      false
    )
  })
})

describe("author input validation", () => {
  it("requires a whole number from 1 through the pool size", () => {
    assert.equal(validateQuestionsPerAttemptInput(2, 4, true, null), null)
    assert.match(
      validateQuestionsPerAttemptInput(0, 4, true, null) ?? "",
      /at least 1/
    )
    assert.match(
      validateQuestionsPerAttemptInput(9, 4, true, null) ?? "",
      /1 to 4/
    )
    assert.equal(validateQuestionsPerAttemptInput(9, 4, true, 9), null)
    assert.equal(subsetExceedsPool(true, 9, 4), true)
    assert.equal(subsetExceedsPool(false, 9, 4), false)
    assert.equal(formatQuestionCount(1), "1 question")
    assert.equal(formatQuestionCount(6), "6 questions")
  })
})

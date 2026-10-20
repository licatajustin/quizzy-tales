import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  MAX_MULTIPLE_SELECTIONS,
  answerPickError,
  toggleLimitedSelection,
  trimAnswerIds,
} from "./answer-limit.ts"
import { selectionForShownQuestions } from "./question-subset.ts"

const multiQuestion = {
  allow_multiple: true,
  answers: [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }],
}

describe("multiple answer cap", () => {
  it("stops a multi question at two picks and still allows an unselect", () => {
    assert.equal(MAX_MULTIPLE_SELECTIONS, 2)

    const first = toggleLimitedSelection([], "a", true)
    const second = toggleLimitedSelection(first, "b", true)
    const blocked = toggleLimitedSelection(second, "c", true)

    assert.deepEqual(second, ["a", "b"])
    assert.equal(blocked, null)

    assert.deepEqual(toggleLimitedSelection(second, "a", true), ["b"])
  })

  it("replaces the only pick on a single-answer question", () => {
    assert.deepEqual(toggleLimitedSelection(["a"], "b", false), ["b"])
    assert.deepEqual(trimAnswerIds(["a", "b", "c"], false), ["a"])
  })

  it("trims a restored attempt to two picks", () => {
    assert.deepEqual(trimAnswerIds(["a", "b", "c", "b"], true), ["a", "b"])

    const selection = selectionForShownQuestions(
      [
        {
          id: "q1",
          allow_multiple: true,
          answers: multiQuestion.answers,
        },
      ],
      { q1: ["a", "b", "c", "d"] }
    )

    assert.deepEqual(selection.selectedByQuestion.q1, ["a", "b"])
    assert.deepEqual(selection.answerIds, ["a", "b"])
  })
})

describe("tracked answer picks", () => {
  it("rejects more than two picks and more than one pick on a single question", () => {
    assert.equal(answerPickError(multiQuestion, ["a", "b"]), null)
    assert.match(
      answerPickError(multiQuestion, ["a", "b", "c"]) ?? "",
      /up to 2/
    )
    assert.match(
      answerPickError(
        { allow_multiple: false, answers: multiQuestion.answers },
        ["a", "b"]
      ) ?? "",
      /one answer/
    )
    assert.equal(
      answerPickError(
        { allow_multiple: false, answers: multiQuestion.answers },
        ["a"]
      ),
      null
    )
    assert.ok(answerPickError(undefined, ["a"]))
  })
})

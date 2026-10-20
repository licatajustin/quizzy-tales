import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { calculateWinningOutcome } from "./scoring.ts"
import type { OutcomeRow } from "./types.ts"

function outcome(id: string, sortOrder: number): OutcomeRow {
  return {
    id,
    quiz_id: "quiz",
    name: id,
    description: "",
    image_url: null,
    sort_order: sortOrder,
  }
}

const alpha = outcome("alpha", 0)
const beta = outcome("beta", 1)
const gamma = outcome("gamma", 2)

describe("calculateWinningOutcome", () => {
  it("returns the unique high score even when it is not first", () => {
    const winner = calculateWinningOutcome(
      [alpha, beta],
      ["a1"],
      [{ id: "a1", weights: { alpha: 1, beta: 3 } }]
    )

    assert.equal(winner?.id, "beta")
  })

  it("breaks a tie toward the outcome scored on the most recent answer", () => {
    const winner = calculateWinningOutcome(
      [alpha, beta],
      ["early", "late"],
      [
        { id: "early", weights: { alpha: 2 } },
        { id: "late", weights: { beta: 2 } },
      ]
    )

    assert.equal(winner?.id, "beta")
  })

  it("lets a higher score on the latest answer beat an earlier sort order", () => {
    const winner = calculateWinningOutcome(
      [beta, alpha],
      ["early", "late"],
      [
        { id: "early", weights: { alpha: 3, beta: 1 } },
        { id: "late", weights: { alpha: 1, beta: 3 } },
      ]
    )

    assert.equal(winner?.id, "beta")
  })

  it("looks past a recent answer that scores the tied outcomes equally", () => {
    const winner = calculateWinningOutcome(
      [alpha, beta],
      ["early", "mid", "late"],
      [
        { id: "early", weights: { alpha: 1 } },
        { id: "mid", weights: { beta: 1 } },
        { id: "late", weights: { alpha: 1, beta: 1 } },
      ]
    )

    assert.equal(winner?.id, "beta")
  })

  it("falls back to a stable attempt seed instead of sort order", () => {
    const answers = [{ id: "a", weights: { alpha: 1, beta: 1, gamma: 1 } }]
    const seeds = [
      "attempt-1",
      "attempt-2",
      "attempt-3",
      "attempt-4",
      "subset-a",
      "subset-b",
      "subset-c",
    ]
    const winners = seeds.map(
      (seed) =>
        calculateWinningOutcome([alpha, beta, gamma], ["a"], answers, seed)?.id
    )
    const reversed = seeds.map(
      (seed) =>
        calculateWinningOutcome([gamma, beta, alpha], ["a"], answers, seed)?.id
    )

    assert.deepEqual(winners, reversed)
    assert.ok(new Set(winners).size > 1)
    assert.equal(
      calculateWinningOutcome([alpha, beta, gamma], ["a"], answers, "attempt-1")
        ?.id,
      winners[0]
    )
    assert.notEqual(winners[0], undefined)
  })

  it("ignores sort_order when the seed cannot be split by recency", () => {
    const answers = [{ id: "a", weights: { alpha: 2, beta: 2 } }]
    const forward = calculateWinningOutcome(
      [alpha, beta],
      ["a"],
      answers,
      "same-attempt"
    )
    const resorted = calculateWinningOutcome(
      [
        { ...alpha, sort_order: 9 },
        { ...beta, sort_order: 0 },
      ],
      ["a"],
      answers,
      "same-attempt"
    )

    assert.equal(forward?.id, resorted?.id)
    assert.notEqual(forward?.id, undefined)
  })

  it("returns a valid outcome when nothing has been answered", () => {
    const winner = calculateWinningOutcome(
      [alpha, beta, gamma],
      [],
      [],
      "attempt-empty"
    )
    const reversed = calculateWinningOutcome(
      [gamma, beta, alpha],
      [],
      [],
      "attempt-empty"
    )

    assert.ok(winner)
    assert.ok([alpha.id, beta.id, gamma.id].includes(winner?.id ?? ""))
    assert.equal(winner?.id, reversed?.id)
    assert.equal(
      calculateWinningOutcome([alpha, beta, gamma], [], [], "attempt-empty")
        ?.id,
      winner?.id
    )
  })

  it("returns null when the quiz has no outcomes", () => {
    assert.equal(calculateWinningOutcome([], ["a"], []), null)
  })
})

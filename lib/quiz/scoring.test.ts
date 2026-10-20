import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  calculateWinningOutcome,
  outcomePointShares,
  scoreOutcomeAttempt,
  tallyOutcomeScores,
} from "./scoring.ts"
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

const namedOutcomes = [
  { id: "wind", name: "Wind" },
  { id: "fire", name: "Fire" },
  { id: "earth", name: "Earth" },
]

describe("tallyOutcomeScores", () => {
  it("adds the full weight of each pick when two answers are selected", () => {
    const answers = [
      { id: "a1", weights: { wind: 4, fire: 1 } },
      { id: "a2", weights: { wind: 3, fire: 6 } },
    ]

    assert.deepEqual(
      tallyOutcomeScores(
        [
          { id: "wind" },
          { id: "fire" },
        ],
        ["a1", "a2"],
        answers
      ),
      { wind: 7, fire: 7 }
    )
  })
})

describe("outcomePointShares", () => {
  it("uses the same tally and tie-break as the winner", () => {
    const answers = [
      { id: "a1", weights: { wind: 3, fire: 1, earth: 0 } },
      { id: "a2", weights: { wind: 2, fire: 2, earth: 2 } },
    ]
    const selected = ["a1", "a2"]
    const scores = tallyOutcomeScores(namedOutcomes, selected, answers)
    const scored = scoreOutcomeAttempt(namedOutcomes, selected, answers, "quiz")
    const winner = calculateWinningOutcome(
      namedOutcomes,
      selected,
      answers,
      "quiz"
    )

    assert.deepEqual(scored.scores, scores)
    assert.equal(scored.winner?.id, winner?.id)
    assert.equal(scored.winner?.id, "wind")
    assert.equal(scored.shares[0]?.id, winner?.id)
    assert.deepEqual(
      scored.shares.map((share) => [share.name, share.points, share.percent]),
      [
        ["Wind", 5, 50],
        ["Fire", 3, 30],
        ["Earth", 2, 20],
      ]
    )
  })

  it("puts the tie-broken winner first when the points are equal", () => {
    const answers = [{ id: "a1", weights: { wind: 1, fire: 1, earth: 1 } }]
    const selected = ["a1"]
    const seed = "attempt-1"
    const winner = calculateWinningOutcome(
      namedOutcomes,
      selected,
      answers,
      seed
    )
    const scored = scoreOutcomeAttempt(namedOutcomes, selected, answers, seed)
    const reversed = scoreOutcomeAttempt(
      [...namedOutcomes].reverse(),
      selected,
      answers,
      seed
    )

    assert.equal(scored.winner?.id, winner?.id)
    assert.equal(scored.shares[0]?.id, winner?.id)
    assert.equal(reversed.winner?.id, winner?.id)
    assert.equal(reversed.shares[0]?.id, winner?.id)
    assert.ok(
      (scored.shares[0]?.percent ?? 0) >= (scored.shares[1]?.percent ?? 0)
    )
    assert.equal(
      scored.shares.reduce((sum, share) => sum + share.percent, 0),
      100
    )
  })

  it("rounds shares so they sum to 100", () => {
    const shares = outcomePointShares(namedOutcomes, {
      wind: 1,
      fire: 1,
      earth: 1,
    })

    assert.deepEqual(
      shares.map((share) => share.percent),
      [34, 33, 33]
    )
    assert.equal(
      shares.reduce((sum, share) => sum + share.percent, 0),
      100
    )
  })

  it("keeps an even split when the points divide cleanly", () => {
    const shares = outcomePointShares(
      [
        { id: "wind", name: "Wind" },
        { id: "fire", name: "Fire" },
      ],
      { wind: 1, fire: 1 }
    )

    assert.deepEqual(
      shares.map((share) => [share.id, share.percent]),
      [
        ["wind", 50],
        ["fire", 50],
      ]
    )
  })

  it("drops negative points out of the share and keeps them at 0%", () => {
    const shares = outcomePointShares(namedOutcomes, {
      wind: 5,
      fire: -3,
      earth: 5,
    })

    assert.deepEqual(
      shares.map((share) => [share.id, share.points, share.percent]),
      [
        ["wind", 5, 50],
        ["earth", 5, 50],
        ["fire", -3, 0],
      ]
    )
  })

  it("returns zeros when nobody scored", () => {
    const shares = outcomePointShares(namedOutcomes, {
      wind: 0,
      fire: 0,
      earth: 0,
    })

    assert.deepEqual(
      shares.map((share) => share.percent),
      [0, 0, 0]
    )
  })

  it("ignores non-finite scores", () => {
    const shares = outcomePointShares(namedOutcomes, {
      wind: Number.NaN,
      fire: 2,
      earth: Number.POSITIVE_INFINITY,
    })

    assert.deepEqual(
      shares.map((share) => [share.id, share.percent]),
      [
        ["fire", 100],
        ["wind", 0],
        ["earth", 0],
      ]
    )
  })
})

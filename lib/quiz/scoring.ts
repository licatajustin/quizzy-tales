type WeightedAnswer = {
  id: string
  weights: Record<string, number>
}

export type OutcomePointShare = {
  id: string
  name: string
  points: number
  percent: number
}

const FNV_OFFSET = 2166136261
const FNV_PRIME = 16777619

/**
 * Stable 32-bit FNV-1a. Used so a tied result does not depend on sort order.
 */
export function hashAttemptSeed(value: string) {
  let hash = FNV_OFFSET

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, FNV_PRIME)
  }

  return hash >>> 0
}

export function tieBreakSeed(
  attemptSeed: string | undefined,
  selectedAnswerIds: readonly string[]
) {
  const answers = selectedAnswerIds.join("\u0000")

  if (attemptSeed) {
    return `${attemptSeed}\u0001${answers}`
  }

  return answers
}

function numericWeight(weight: unknown) {
  return typeof weight === "number" && Number.isFinite(weight) ? weight : 0
}

function pointsFor(answer: WeightedAnswer | undefined, outcomeId: string) {
  if (!answer) {
    return 0
  }

  return numericWeight(answer.weights[outcomeId])
}

/**
 * Walk answers from newest to oldest. An answer splits the tie when one or
 * more of the remaining outcomes strictly outscore the others on it.
 */
function narrowTiedByRecency<T extends { id: string }>(
  tied: readonly T[],
  selectedAnswerIds: readonly string[],
  answersById: ReadonlyMap<string, WeightedAnswer>
) {
  let remaining: T[] = [...tied]

  for (
    let index = selectedAnswerIds.length - 1;
    index >= 0 && remaining.length > 1;
    index -= 1
  ) {
    const answer = answersById.get(selectedAnswerIds[index])
    let best = 0

    for (const outcome of remaining) {
      const points = pointsFor(answer, outcome.id)
      if (points > best) {
        best = points
      }
    }

    if (best <= 0) {
      continue
    }

    const scored = remaining.filter(
      (outcome) => pointsFor(answer, outcome.id) === best
    )

    if (scored.length === 0 || scored.length === remaining.length) {
      continue
    }

    remaining = scored
  }

  return remaining
}

function pickSeededOutcome<T extends { id: string }>(
  tied: readonly T[],
  seed: string
) {
  let winner = tied[0]
  let winnerRank = hashAttemptSeed(`${seed}\u0000${winner.id}`)

  for (const candidate of tied.slice(1)) {
    const rank = hashAttemptSeed(`${seed}\u0000${candidate.id}`)

    if (
      rank > winnerRank ||
      (rank === winnerRank && candidate.id < winner.id)
    ) {
      winner = candidate
      winnerRank = rank
    }
  }

  return winner
}

export function tallyOutcomeScores(
  outcomes: { id: string }[],
  selectedAnswerIds: readonly string[],
  answers: WeightedAnswer[]
) {
  const scores = Object.fromEntries(outcomes.map((outcome) => [outcome.id, 0]))
  const answersById = new Map(answers.map((answer) => [answer.id, answer]))

  for (const answerId of selectedAnswerIds) {
    const answer = answersById.get(answerId)
    if (!answer) continue

    for (const [outcomeId, weight] of Object.entries(answer.weights)) {
      if (!(outcomeId in scores)) continue
      scores[outcomeId] += numericWeight(weight)
    }
  }

  return scores
}

function selectWinningOutcome<T extends { id: string }>(
  outcomes: T[],
  scores: Record<string, number>,
  selectedAnswerIds: readonly string[],
  answers: WeightedAnswer[],
  attemptSeed?: string
) {
  if (outcomes.length === 0) {
    return null
  }

  let highest = -Infinity

  for (const outcome of outcomes) {
    const score = scores[outcome.id] ?? 0
    if (score > highest) {
      highest = score
    }
  }

  const tied = outcomes.filter(
    (outcome) => (scores[outcome.id] ?? 0) === highest
  )

  if (tied.length === 1) {
    return tied[0]
  }

  const answersById = new Map(answers.map((answer) => [answer.id, answer]))
  const recent = narrowTiedByRecency(tied, selectedAnswerIds, answersById)

  if (recent.length === 1) {
    return recent[0]
  }

  return pickSeededOutcome(recent, tieBreakSeed(attemptSeed, selectedAnswerIds))
}

export function calculateWinningOutcome(
  outcomes: { id: string }[],
  selectedAnswerIds: string[],
  answers: WeightedAnswer[],
  attemptSeed?: string
) {
  return selectWinningOutcome(
    outcomes,
    tallyOutcomeScores(outcomes, selectedAnswerIds, answers),
    selectedAnswerIds,
    answers,
    attemptSeed
  )
}

function finitePoints(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

function percentsFromWeights(weights: number[], preference: number[] = []) {
  const total = weights.reduce((sum, value) => sum + value, 0)
  if (total <= 0) {
    return weights.map(() => 0)
  }

  const raw = weights.map((value) => (value / total) * 100)
  const percents = raw.map((value) => Math.floor(value))
  let leftover = 100 - percents.reduce((sum, value) => sum + value, 0)
  const ranked = raw
    .map((value, index) => ({
      index,
      fraction: value - Math.floor(value),
      preference: preference[index] ?? index,
    }))
    .sort(
      (a, b) =>
        b.fraction - a.fraction ||
        a.preference - b.preference ||
        a.index - b.index
    )

  for (const entry of ranked) {
    if (leftover <= 0) {
      break
    }

    percents[entry.index] += 1
    leftover -= 1
  }

  return percents
}

export function outcomePointShares(
  outcomes: { id: string; name: string }[],
  scores: Record<string, number>,
  winnerId?: string
): OutcomePointShare[] {
  const rows = outcomes.map((outcome, index) => {
    const points = finitePoints(scores[outcome.id])
    return {
      id: outcome.id,
      name: outcome.name,
      points,
      positive: Math.max(0, points),
      index,
      preference: outcome.id === winnerId ? 0 : index + 1,
    }
  })
  const percents = percentsFromWeights(
    rows.map((row) => row.positive),
    rows.map((row) => row.preference)
  )

  return rows
    .map((row, index) => ({
      id: row.id,
      name: row.name,
      points: row.points,
      percent: percents[index] ?? 0,
      index: row.index,
      preference: row.preference,
    }))
    .sort(
      (a, b) =>
        b.percent - a.percent ||
        a.preference - b.preference ||
        a.index - b.index
    )
    .map(({ id, name, points, percent }) => ({ id, name, points, percent }))
}

export function scoreOutcomeAttempt<T extends { id: string; name: string }>(
  outcomes: T[],
  selectedAnswerIds: string[],
  answers: WeightedAnswer[],
  attemptSeed?: string
) {
  const scores = tallyOutcomeScores(outcomes, selectedAnswerIds, answers)
  const winner = selectWinningOutcome(
    outcomes,
    scores,
    selectedAnswerIds,
    answers,
    attemptSeed
  )

  return {
    scores,
    winner,
    shares: outcomePointShares(outcomes, scores, winner?.id),
  }
}

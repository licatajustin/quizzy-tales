type WeightedAnswer = {
  id: string
  weights: Record<string, number>
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
function narrowTiedByRecency(
  tied: readonly OutcomeRow[],
  selectedAnswerIds: readonly string[],
  answersById: ReadonlyMap<string, WeightedAnswer>
) {
  let remaining = [...tied]

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

function pickSeededOutcome(tied: readonly OutcomeRow[], seed: string) {
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

export function calculateWinningOutcome(
  outcomes: { id: string }[],
  selectedAnswerIds: string[],
  answers: WeightedAnswer[],
  attemptSeed?: string
) {
  if (outcomes.length === 0) {
    return null
  }

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

  const recent = narrowTiedByRecency(tied, selectedAnswerIds, answersById)

  if (recent.length === 1) {
    return recent[0]
  }

  return pickSeededOutcome(recent, tieBreakSeed(attemptSeed, selectedAnswerIds))
}

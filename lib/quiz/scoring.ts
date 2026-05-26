import type { OutcomeRow } from "@/lib/quiz/types"

type WeightedAnswer = {
  id: string
  weights: Record<string, number>
}

export function calculateWinningOutcome(
  outcomes: OutcomeRow[],
  selectedAnswerIds: string[],
  answers: WeightedAnswer[]
) {
  if (outcomes.length === 0) {
    return null
  }

  const scores = Object.fromEntries(outcomes.map((outcome) => [outcome.id, 0]))

  for (const answerId of selectedAnswerIds) {
    const answer = answers.find((item) => item.id === answerId)
    if (!answer) continue

    for (const [outcomeId, weight] of Object.entries(answer.weights)) {
      scores[outcomeId] = (scores[outcomeId] ?? 0) + weight
    }
  }

  let winner = outcomes[0]
  let highest = scores[winner.id] ?? 0

  for (const outcome of outcomes.slice(1)) {
    const score = scores[outcome.id] ?? 0
    if (score > highest) {
      highest = score
      winner = outcome
    }
  }

  return winner
}

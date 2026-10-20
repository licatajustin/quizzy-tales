export const MAX_MULTIPLE_SELECTIONS = 2

export function selectionLimit(allowMultiple: boolean) {
  return allowMultiple ? MAX_MULTIPLE_SELECTIONS : 1
}

export function trimAnswerIds(
  answerIds: readonly string[],
  allowMultiple: boolean
) {
  const limit = selectionLimit(allowMultiple)
  const seen = new Set<string>()
  const next: string[] = []

  for (const id of answerIds) {
    if (!id || seen.has(id)) {
      continue
    }

    seen.add(id)
    next.push(id)

    if (next.length >= limit) {
      break
    }
  }

  return next
}

/**
 * Returns null when another pick would pass the cap.
 */
export function toggleLimitedSelection(
  previous: readonly string[],
  answerId: string,
  allowMultiple: boolean
): string[] | null {
  if (!allowMultiple) {
    return [answerId]
  }

  if (previous.includes(answerId)) {
    return previous.filter((id) => id !== answerId)
  }

  if (previous.length >= MAX_MULTIPLE_SELECTIONS) {
    return null
  }

  return [...previous, answerId]
}

export function answerPickError(
  question:
    | {
        allow_multiple?: boolean
        answers?: readonly { id: string }[]
      }
    | null
    | undefined,
  answerIds: readonly string[]
) {
  if (!question) {
    return "Question is not on the live quiz."
  }

  const limit = selectionLimit(Boolean(question.allow_multiple))

  if (answerIds.length > limit) {
    return limit === 1
      ? "This question accepts one answer."
      : `This question accepts up to ${limit} answers.`
  }

  const allowed = new Set((question.answers ?? []).map((answer) => answer.id))

  if (answerIds.some((id) => !allowed.has(id))) {
    return "Answer is not on this question."
  }

  return null
}

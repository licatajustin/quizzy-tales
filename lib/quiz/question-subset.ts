export type StoredQuizAttemptState = "playing" | "result"

export type StoredQuizAttempt = {
  questionIds: string[]
  selectedByQuestion: Record<string, string[]>
  questionIndex: number
  state: StoredQuizAttemptState
}

type QuestionLike = { id: string }

/**
 * Unbiased in-place Fisher-Yates. `random` must return a number in [0, 1).
 */
export function fisherYatesShuffle<T>(
  items: readonly T[],
  random: () => number = Math.random
): T[] {
  const next = [...items]

  for (let index = next.length - 1; index > 0; index -= 1) {
    const roll = random()
    const swapIndex = Math.min(index, Math.floor(roll * (index + 1)))
    const current = next[index]
    next[index] = next[swapIndex]
    next[swapIndex] = current
  }

  return next
}

/**
 * How many questions a reader should see.
 * Disabled, missing, or N greater than the pool shows every question.
 */
export function resolveQuestionsPerAttempt(
  enabled: boolean | null | undefined,
  requested: number | null | undefined,
  poolSize: number
): number {
  if (poolSize <= 0) {
    return 0
  }

  if (!enabled) {
    return poolSize
  }

  if (
    typeof requested !== "number" ||
    !Number.isInteger(requested) ||
    requested < 1
  ) {
    return poolSize
  }

  return Math.min(requested, poolSize)
}

export function validateQuestionsPerAttemptInput(
  value: number | null,
  poolSize: number,
  enabled: boolean,
  previouslySaved: number | null
): string | null {
  if (!enabled) {
    if (value == null) {
      return null
    }

    if (!Number.isInteger(value) || value < 1) {
      return "Questions per attempt must be a whole number of at least 1."
    }

    return null
  }

  if (poolSize < 1) {
    return "Add at least one question before using a random subset."
  }

  if (value == null || !Number.isInteger(value) || value < 1) {
    return "Enter a whole number of at least 1."
  }

  if (value > poolSize && value !== previouslySaved) {
    return `Enter a number from 1 to ${poolSize}.`
  }

  return null
}

export function subsetExceedsPool(
  enabled: boolean,
  value: number | null,
  poolSize: number
) {
  return Boolean(enabled && value != null && poolSize > 0 && value > poolSize)
}

/**
 * Map a saved id list back onto the current pool.
 * Returns null when any id is missing, duplicated, or the length is not N,
 * so the caller can draw a fresh subset.
 */
export function resolvePersistedQuestions<T extends QuestionLike>(
  pool: readonly T[],
  persistedIds: readonly string[] | null | undefined,
  count: number
): T[] | null {
  if (!persistedIds || count < 1 || count >= pool.length) {
    return null
  }

  if (persistedIds.length !== count) {
    return null
  }

  const byId = new Map(pool.map((question) => [question.id, question]))
  const seen = new Set<string>()
  const resolved: T[] = []

  for (const id of persistedIds) {
    const question = byId.get(id)
    if (!question || seen.has(id)) {
      return null
    }

    seen.add(id)
    resolved.push(question)
  }

  return resolved
}

/**
 * Draw `count` questions. When the request covers the whole pool, keep the
 * original order so quizzes that are not actually subsetting stay stable.
 */
export function pickRandomQuestions<T>(
  pool: readonly T[],
  count: number,
  random: () => number = Math.random
): T[] {
  if (count >= pool.length) {
    return [...pool]
  }

  if (count <= 0) {
    return []
  }

  return fisherYatesShuffle(pool, random).slice(0, count)
}

export function selectionForShownQuestions(
  questions: readonly { id: string; answers: readonly { id: string }[] }[],
  selectedByQuestion: Record<string, string[]>
) {
  const allowedAnswers = new Map(
    questions.map((question) => [
      question.id,
      new Set(question.answers.map((answer) => answer.id)),
    ])
  )
  const selected: Record<string, string[]> = {}
  const answerIds: string[] = []

  for (const [questionId, chosen] of Object.entries(selectedByQuestion)) {
    const allowed = allowedAnswers.get(questionId)
    if (!allowed || !Array.isArray(chosen)) {
      continue
    }

    const valid = chosen.filter((answerId) => allowed.has(answerId))
    if (valid.length === 0) {
      continue
    }

    selected[questionId] = valid
    answerIds.push(...valid)
  }

  return { selectedByQuestion: selected, answerIds }
}

export function attemptStorageKey(quizId: string, preview: boolean) {
  return preview
    ? `quizzy:attempt:preview:${quizId}`
    : `quizzy:attempt:${quizId}`
}

export function parseStoredQuizAttempt(
  raw: string | null
): StoredQuizAttempt | null {
  if (!raw) {
    return null
  }

  try {
    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return null
    }

    const record = value as Record<string, unknown>
    if (
      !Array.isArray(record.questionIds) ||
      record.questionIds.length === 0 ||
      record.questionIds.some((id) => typeof id !== "string" || id.length === 0)
    ) {
      return null
    }

    if (record.state !== "playing" && record.state !== "result") {
      return null
    }

    if (
      typeof record.questionIndex !== "number" ||
      !Number.isInteger(record.questionIndex) ||
      record.questionIndex < 0
    ) {
      return null
    }

    if (
      !record.selectedByQuestion ||
      typeof record.selectedByQuestion !== "object" ||
      Array.isArray(record.selectedByQuestion)
    ) {
      return null
    }

    const selectedByQuestion: Record<string, string[]> = {}

    for (const [questionId, answerIds] of Object.entries(
      record.selectedByQuestion as Record<string, unknown>
    )) {
      if (
        !Array.isArray(answerIds) ||
        answerIds.some((answerId) => typeof answerId !== "string")
      ) {
        return null
      }

      selectedByQuestion[questionId] = answerIds
    }

    return {
      questionIds: record.questionIds as string[],
      selectedByQuestion,
      questionIndex: record.questionIndex,
      state: record.state,
    }
  } catch {
    return null
  }
}

export function serializeStoredQuizAttempt(attempt: StoredQuizAttempt) {
  return JSON.stringify(attempt)
}

const ATTEMPT_STORAGE_PENDING = "\u0000pending"
const attemptStorageListeners = new Set<() => void>()

export function subscribeAttemptStorage(onChange: () => void) {
  attemptStorageListeners.add(onChange)

  if (typeof window !== "undefined") {
    window.addEventListener("storage", onChange)
  }

  return () => {
    attemptStorageListeners.delete(onChange)

    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onChange)
    }
  }
}

export function notifyAttemptStorage() {
  for (const listener of attemptStorageListeners) {
    listener()
  }
}

export function readAttemptStorageSnapshot(key: string | null) {
  if (!key || typeof window === "undefined") {
    return ""
  }

  return window.localStorage.getItem(key) ?? ""
}

export function getAttemptStorageServerSnapshot(key: string | null) {
  return key ? ATTEMPT_STORAGE_PENDING : ""
}

export function isAttemptStoragePending(snapshot: string) {
  return snapshot === ATTEMPT_STORAGE_PENDING
}

export function readStoredQuizAttempt(
  storage: Pick<Storage, "getItem">,
  key: string
) {
  return parseStoredQuizAttempt(storage.getItem(key))
}

export function writeStoredQuizAttempt(
  storage: Pick<Storage, "setItem">,
  key: string,
  attempt: StoredQuizAttempt
) {
  storage.setItem(key, serializeStoredQuizAttempt(attempt))
}

export function formatQuestionCount(count: number) {
  return `${count} ${count === 1 ? "question" : "questions"}`
}

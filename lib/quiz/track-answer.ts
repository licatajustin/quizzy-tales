import { answerPickError } from "@/lib/quiz/answer-limit"
import type { PublishedQuizSnapshot } from "@/lib/quiz/types"

type AnswerPayload = {
  sessionId: string
  questionId: string
  answerIds: string[]
}

type RowResult = {
  data: Record<string, unknown> | null
  error: { message: string } | null
}

type Query = PromiseLike<{ error: { message: string } | null }> & {
  select: (columns?: string) => Query
  eq: (column: string, value: string) => Query
  delete: () => Query
  insert: (values: unknown) => Promise<{ error: { message: string } | null }>
  maybeSingle: () => Promise<RowResult>
}

export type TrackAnswerAdmin = {
  from: (table: string) => Query
}

export async function recordTrackedAnswers(
  admin: TrackAnswerAdmin,
  payload: AnswerPayload
) {
  const sessionResult = await admin
    .from("reader_sessions")
    .select("quiz_id")
    .eq("id", payload.sessionId)
    .maybeSingle()

  const quizId = sessionResult.data?.quiz_id

  if (sessionResult.error || typeof quizId !== "string") {
    return { error: "Session not found" }
  }

  const quizResult = await admin
    .from("quizzes")
    .select("published_snapshot")
    .eq("id", quizId)
    .maybeSingle()

  const snapshot = quizResult.data?.published_snapshot as
    | PublishedQuizSnapshot
    | null
    | undefined
  const question = snapshot?.questions?.find(
    (item) => item.id === payload.questionId
  )
  const pickError = answerPickError(question, payload.answerIds)

  if (quizResult.error || !snapshot || pickError) {
    return { error: pickError ?? "Quiz not found" }
  }

  await admin
    .from("reader_answers")
    .delete()
    .eq("session_id", payload.sessionId)
    .eq("question_id", payload.questionId)

  const inserted = await admin.from("reader_answers").insert(
    payload.answerIds.map((answerId) => ({
      session_id: payload.sessionId,
      question_id: payload.questionId,
      answer_id: answerId,
    }))
  )

  if (inserted.error) {
    return { error: "Could not save answers." }
  }

  return { ok: true as const }
}

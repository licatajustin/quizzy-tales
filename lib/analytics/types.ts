import { z } from "zod"

const utmFields = {
  utm_source: z.string().max(200).optional(),
  utm_medium: z.string().max(200).optional(),
  utm_campaign: z.string().max(200).optional(),
}

const contextFields = {
  referrer: z.string().max(2000).optional(),
  deviceType: z.string().max(50).optional(),
  ...utmFields,
}

export const trackPayloadSchema = z.discriminatedUnion("event", [
  z.object({
    event: z.literal("view"),
    quizId: z.string().uuid(),
    anonymousId: z.string().min(1).max(200),
    sessionId: z.string().uuid(),
    ...contextFields,
  }),
  z.object({
    event: z.literal("start"),
    quizId: z.string().uuid(),
    sessionId: z.string().uuid(),
    anonymousId: z.string().min(1).max(200),
    ...contextFields,
  }),
  z.object({
    event: z.literal("answer"),
    sessionId: z.string().uuid(),
    questionId: z.string().uuid(),
    answerIds: z.array(z.string().uuid()).min(1),
  }),
  z.object({
    event: z.literal("complete"),
    quizId: z.string().uuid(),
    sessionId: z.string().uuid(),
    resultId: z.string().uuid(),
    outcomeId: z.string().uuid().optional(),
  }),
  z.object({
    event: z.literal("share"),
    quizId: z.string().uuid(),
    sessionId: z.string().uuid(),
    platform: z.string().min(1).max(50),
  }),
  z.object({
    event: z.literal("book_cta_click"),
    quizId: z.string().uuid(),
    sessionId: z.string().uuid(),
  }),
])

export type TrackPayload = z.infer<typeof trackPayloadSchema>

export type QuizAnalyticsSummary = {
  views: number
  starts: number
  completions: number
  shares: number
  completionRate: number
  outcomeCounts: { outcomeId: string; name: string; count: number }[]
  dailyActivity: { date: string; label: string; starts: number; completions: number }[]
}

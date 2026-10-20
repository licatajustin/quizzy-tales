import { NextResponse } from "next/server"

import { trackPayloadSchema } from "@/lib/analytics/types"
import {
  recordTrackedAnswers,
  type TrackAnswerAdmin,
} from "@/lib/quiz/track-answer"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = trackPayloadSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const payload = parsed.data

  try {
    const admin = createAdminClient()

    switch (payload.event) {
      case "view": {
        await admin.from("quiz_events").insert({
          quiz_id: payload.quizId,
          event_type: "view",
          metadata: {
            anonymous_id: payload.anonymousId,
            session_id: payload.sessionId,
            referrer: payload.referrer ?? null,
            utm_source: payload.utm_source ?? null,
            utm_medium: payload.utm_medium ?? null,
            utm_campaign: payload.utm_campaign ?? null,
            device_type: payload.deviceType ?? null,
          },
        })
        break
      }

      case "start": {
        await admin.from("reader_sessions").upsert(
          {
            id: payload.sessionId,
            quiz_id: payload.quizId,
            anonymous_id: payload.anonymousId,
            referrer: payload.referrer ?? null,
            utm_source: payload.utm_source ?? null,
            utm_medium: payload.utm_medium ?? null,
            utm_campaign: payload.utm_campaign ?? null,
            device_type: payload.deviceType ?? null,
          },
          { onConflict: "id" }
        )

        await admin.from("quiz_events").insert({
          quiz_id: payload.quizId,
          event_type: "start",
          metadata: {
            session_id: payload.sessionId,
            anonymous_id: payload.anonymousId,
          },
        })
        break
      }

      case "answer": {
        const recorded = await recordTrackedAnswers(
          admin as unknown as TrackAnswerAdmin,
          payload
        )

        if ("error" in recorded) {
          return NextResponse.json({ error: recorded.error }, { status: 400 })
        }

        break
      }

      case "complete": {
        await admin
          .from("reader_sessions")
          .update({
            completed_at: new Date().toISOString(),
            result_id: payload.resultId,
          })
          .eq("id", payload.sessionId)

        await admin.from("quiz_events").insert({
          quiz_id: payload.quizId,
          event_type: "complete",
          outcome_id: payload.outcomeId ?? payload.resultId,
          metadata: { session_id: payload.sessionId },
        })
        break
      }

      case "share": {
        await admin.from("quiz_events").insert({
          quiz_id: payload.quizId,
          event_type: "share",
          metadata: {
            session_id: payload.sessionId,
            platform: payload.platform,
          },
        })
        break
      }

      case "book_cta_click": {
        await admin.from("quiz_events").insert({
          quiz_id: payload.quizId,
          event_type: "cta_click",
          metadata: { session_id: payload.sessionId },
        })
        break
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Track API error:", error)
    return NextResponse.json({ error: "Tracking failed" }, { status: 500 })
  }
}

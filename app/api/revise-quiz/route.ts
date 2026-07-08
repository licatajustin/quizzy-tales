import { NextResponse } from "next/server"
import { generateObject } from "ai"

import { requireAiAccessForKind, recordAiUsageForKind } from "@/lib/ai/auth"
import { TEXT_MODEL } from "@/lib/ai/models"
import { buildReviseQuizPrompt } from "@/lib/ai/prompts"
import {
  quizRevisionPatchSchema,
  reviseQuizRequestSchema,
} from "@/lib/ai/schemas"
import { draftToAiRevisionContext } from "@/lib/quiz/ai-save"
import { getQuizDraft } from "@/lib/quiz/queries"

export async function POST(request: Request) {
  const auth = await requireAiAccessForKind("revise-quiz")

  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status }
    )
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const parsed = reviseQuizRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 }
    )
  }

  const draft = await getQuizDraft(auth.supabase, parsed.data.quiz_id)

  if (!draft || draft.quiz.author_id !== auth.userId) {
    return NextResponse.json({ error: "Quiz not found." }, { status: 404 })
  }

  const currentQuizJson = JSON.stringify(
    draftToAiRevisionContext(draft),
    null,
    2
  )

  try {
    const { object } = await generateObject({
      model: TEXT_MODEL,
      schema: quizRevisionPatchSchema,
      prompt: buildReviseQuizPrompt({
        bookTitle: draft.quiz.book_title,
        quizTitle: draft.quiz.quiz_title,
        instruction: parsed.data.instruction,
        currentQuizJson,
      }),
    })

    await auth.supabase.from("quiz_ai_messages").insert([
      {
        quiz_id: parsed.data.quiz_id,
        user_id: auth.userId,
        role: "user",
        message: parsed.data.instruction,
      },
      {
        quiz_id: parsed.data.quiz_id,
        user_id: auth.userId,
        role: "assistant",
        message: object.summary,
        structured_patch: object,
      },
    ])

    await recordAiUsageForKind(auth.userId, "revise-quiz")

    return NextResponse.json({ patch: object })
  } catch (error) {
    console.error("revise-quiz failed:", error)
    return NextResponse.json(
      { error: "Could not revise quiz. Please try again." },
      { status: 500 }
    )
  }
}

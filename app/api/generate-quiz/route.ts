import { NextResponse } from "next/server"
import { generateObject } from "ai"

import { requireAiAccessForKind, recordAiUsageForKind } from "@/lib/ai/auth"
import { TEXT_MODEL } from "@/lib/ai/models"
import { buildGenerateQuizPrompt } from "@/lib/ai/prompts"
import {
  generateQuizRequestSchema,
  generatedQuizSchema,
} from "@/lib/ai/schemas"

export async function POST(request: Request) {
  const auth = await requireAiAccessForKind("generate-quiz")

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

  const parsed = generateQuizRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 }
    )
  }

  const input = parsed.data

  const { data: author } = await auth.supabase
    .from("authors")
    .select("display_name")
    .eq("id", auth.userId)
    .maybeSingle()

  const characterCount =
    input.outcomes?.length ?? input.character_count

  try {
    const { object } = await generateObject({
      model: TEXT_MODEL,
      schema: generatedQuizSchema,
      prompt: buildGenerateQuizPrompt({
        bookTitle: input.book_title,
        synopsis: input.synopsis,
        characterCount,
        quizTitle: input.quiz_title,
        authorName: input.author_name,
        authorDisplayName: author?.display_name,
        outcomes: input.outcomes,
        bookResearch: input.book_research,
        tone: input.tone,
        questionStyle: input.question_style,
        includeDescriptions: input.include_descriptions,
      }),
    })

    await recordAiUsageForKind(auth.userId, "generate-quiz")

    return NextResponse.json({ quiz: object })
  } catch (error) {
    console.error("generate-quiz failed:", error)
    return NextResponse.json(
      { error: "Could not generate quiz. Please try again." },
      { status: 500 }
    )
  }
}

import { NextResponse } from "next/server"
import { generateObject } from "ai"

import { requireAiAccessForKind, recordAiUsageForKind } from "@/lib/ai/auth"
import { TEXT_MODEL } from "@/lib/ai/models"
import { toStoredProfiles } from "@/lib/ai/outcome-profile"
import { buildOutcomeDetailsPrompt } from "@/lib/ai/prompts"
import {
  generateOutcomeDetailsRequestSchema,
  generatedOutcomeProfilesModelSchema,
} from "@/lib/ai/schemas"
import { mergeGeneratedProfile } from "@/lib/quiz/outcome-details"
import { getQuizDraft } from "@/lib/quiz/queries"
import { revalidateLiveQuizPaths } from "@/lib/quiz/revalidate"

export async function POST(request: Request) {
  const auth = await requireAiAccessForKind("revise-quiz")

  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const parsed = generateOutcomeDetailsRequestSchema.safeParse(body)

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

  const targets = parsed.data.outcome_id
    ? draft.outcomes.filter((outcome) => outcome.id === parsed.data.outcome_id)
    : draft.outcomes

  if (targets.length === 0) {
    return NextResponse.json({ error: "Outcome not found." }, { status: 404 })
  }

  try {
    const { object } = await generateObject({
      model: TEXT_MODEL,
      schema: generatedOutcomeProfilesModelSchema,
      prompt: buildOutcomeDetailsPrompt({
        bookTitle: draft.quiz.book_title,
        quizTitle: draft.quiz.quiz_title,
        outcomes: targets.map((outcome) => ({
          id: outcome.id,
          name: outcome.name,
          description: outcome.description,
          tagline: outcome.tagline,
        })),
        questionTexts: draft.questions.map(
          (question) => question.question_text
        ),
      }),
    })

    const profiles = toStoredProfiles(object)
    const updatedIds = new Set<string>()

    for (const [index, profile] of profiles.entries()) {
      const existing =
        targets.find((outcome) => outcome.id === profile.id) ??
        (profiles.length === targets.length ? targets[index] : undefined)

      if (!existing || updatedIds.has(existing.id)) {
        continue
      }

      const merged = mergeGeneratedProfile(existing, profile)
      const { error } = await auth.supabase
        .from("outcomes")
        .update({
          description: merged.description,
          tagline: merged.tagline,
          details: merged.details,
        })
        .eq("id", existing.id)
        .eq("quiz_id", draft.quiz.id)

      if (error) {
        throw new Error(error.message)
      }

      updatedIds.add(existing.id)
    }

    if (updatedIds.size === 0) {
      return NextResponse.json(
        { error: "Could not write result profiles. Please try again." },
        { status: 500 }
      )
    }

    await recordAiUsageForKind(auth.userId, "revise-quiz")
    revalidateLiveQuizPaths(draft.quiz.id, draft.quiz.slug)

    return NextResponse.json({ updated: updatedIds.size })
  } catch (error) {
    console.error("generate-outcome-details failed:", error)
    return NextResponse.json(
      { error: "Could not write result profiles. Please try again." },
      { status: 500 }
    )
  }
}

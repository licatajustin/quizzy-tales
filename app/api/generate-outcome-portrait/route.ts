import { NextResponse } from "next/server"
import { generateImage } from "ai"

import { requireAiAccessForKind, recordAiUsageForKind } from "@/lib/ai/auth"
import { getOutcomeImageStyle } from "@/lib/ai/outcome-image-styles"
import {
  buildOutcomeImagePath,
  getOutcomeImagesBucket,
  getPublicStorageUrl,
} from "@/lib/ai/outcome-images"
import { IMAGE_MODEL, IMAGE_PORTRAIT_SIZE } from "@/lib/ai/models"
import { buildPortraitPrompt } from "@/lib/ai/prompts"
import { generatePortraitRequestSchema } from "@/lib/ai/schemas"
import { getSupabaseUrl } from "@/lib/supabase/env"

export async function POST(request: Request) {
  const auth = await requireAiAccessForKind("portrait")

  if ("error" in auth) {
    return NextResponse.json(
      {
        error: auth.error,
        remaining: auth.remainingImages ?? 0,
      },
      { status: auth.status }
    )
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const parsed = generatePortraitRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 }
    )
  }

  const { quiz_id, outcome_id, style_id, art_direction } = parsed.data

  const { data: quiz } = await auth.supabase
    .from("quizzes")
    .select("id, author_id, book_title")
    .eq("id", quiz_id)
    .maybeSingle()

  if (!quiz || quiz.author_id !== auth.userId) {
    return NextResponse.json({ error: "Quiz not found." }, { status: 404 })
  }

  const { data: outcome } = await auth.supabase
    .from("outcomes")
    .select("id, name, description")
    .eq("id", outcome_id)
    .eq("quiz_id", quiz_id)
    .maybeSingle()

  if (!outcome) {
    return NextResponse.json({ error: "Outcome not found." }, { status: 404 })
  }

  const style = getOutcomeImageStyle(style_id)

  if (!style) {
    return NextResponse.json({ error: "Invalid style." }, { status: 400 })
  }

  try {
    const result = await generateImage({
      model: IMAGE_MODEL,
      prompt: buildPortraitPrompt({
        bookTitle: quiz.book_title,
        outcomeName: outcome.name,
        outcomeDescription: outcome.description,
        stylePrompt: style.prompt,
        artDirection: art_direction,
      }),
      size: IMAGE_PORTRAIT_SIZE,
    })

    const image = result.images[0]

    if (!image) {
      throw new Error("No image returned from model.")
    }

    const bytes = image.uint8Array
    const storagePath = buildOutcomeImagePath(
      auth.userId,
      quiz_id,
      outcome_id,
      "webp"
    )

    const { error: uploadError } = await auth.supabase.storage
      .from(getOutcomeImagesBucket())
      .upload(storagePath, bytes, {
        contentType: "image/webp",
        upsert: false,
      })

    if (uploadError) {
      throw new Error(uploadError.message)
    }

    const imageUrl = getPublicStorageUrl(getSupabaseUrl(), storagePath)

    const { error: updateError } = await auth.supabase
      .from("outcomes")
      .update({ image_url: imageUrl })
      .eq("id", outcome_id)

    if (updateError) {
      throw new Error(updateError.message)
    }

    await recordAiUsageForKind(auth.userId, "portrait")

    return NextResponse.json({
      image_url: imageUrl,
      remaining: Math.max(0, (auth.remainingImages ?? 1) - 1),
    })
  } catch (error) {
    console.error("generate-outcome-portrait failed:", error)
    return NextResponse.json(
      { error: "Could not generate portrait. Please try again." },
      { status: 500 }
    )
  }
}

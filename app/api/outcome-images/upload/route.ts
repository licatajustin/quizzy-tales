import { NextResponse } from "next/server"

import {
  buildOutcomeImagePath,
  detectImageExtension,
  getOutcomeImagesBucket,
  getPublicStorageUrl,
} from "@/lib/ai/outcome-images"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseUrl } from "@/lib/supabase/env"

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let formData: FormData

  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 })
  }

  const quizId = String(formData.get("quiz_id") ?? "")
  const outcomeId = String(formData.get("outcome_id") ?? "")
  const file = formData.get("file")

  if (!quizId || !outcomeId || !(file instanceof File)) {
    return NextResponse.json(
      { error: "quiz_id, outcome_id, and file are required." },
      { status: 400 }
    )
  }

  const extension = detectImageExtension(file.type)

  if (!extension) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, and WebP images are supported." },
      { status: 400 }
    )
  }

  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Image must be 8 MB or smaller." },
      { status: 400 }
    )
  }

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, author_id")
    .eq("id", quizId)
    .maybeSingle()

  if (!quiz || quiz.author_id !== user.id) {
    return NextResponse.json({ error: "Quiz not found." }, { status: 404 })
  }

  const { data: outcome } = await supabase
    .from("outcomes")
    .select("id")
    .eq("id", outcomeId)
    .eq("quiz_id", quizId)
    .maybeSingle()

  if (!outcome) {
    return NextResponse.json({ error: "Outcome not found." }, { status: 404 })
  }

  const storagePath = buildOutcomeImagePath(
    user.id,
    quizId,
    outcomeId,
    extension
  )
  const bytes = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from(getOutcomeImagesBucket())
    .upload(storagePath, bytes, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const imageUrl = getPublicStorageUrl(getSupabaseUrl(), storagePath)

  const { error: updateError } = await supabase
    .from("outcomes")
    .update({ image_url: imageUrl })
    .eq("id", outcomeId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ image_url: imageUrl })
}

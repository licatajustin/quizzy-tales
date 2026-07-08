import { NextResponse } from "next/server"

import {
  getOutcomeImagesBucket,
  storagePathFromPublicUrl,
} from "@/lib/ai/outcome-images"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { outcome_id?: string }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const outcomeId = body.outcome_id

  if (!outcomeId) {
    return NextResponse.json({ error: "outcome_id is required." }, { status: 400 })
  }

  const { data: outcome } = await supabase
    .from("outcomes")
    .select("id, quiz_id, image_url")
    .eq("id", outcomeId)
    .maybeSingle()

  if (!outcome) {
    return NextResponse.json({ error: "Outcome not found." }, { status: 404 })
  }

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("author_id")
    .eq("id", outcome.quiz_id)
    .maybeSingle()

  if (!quiz || quiz.author_id !== user.id) {
    return NextResponse.json({ error: "Outcome not found." }, { status: 404 })
  }

  if (outcome.image_url) {
    const storagePath = storagePathFromPublicUrl(outcome.image_url)

    if (storagePath?.startsWith(`authors/${user.id}/`)) {
      await supabase.storage.from(getOutcomeImagesBucket()).remove([storagePath])
    }
  }

  const { error } = await supabase
    .from("outcomes")
    .update({ image_url: null })
    .eq("id", outcomeId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

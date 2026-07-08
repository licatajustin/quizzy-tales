import { NextResponse } from "next/server"

import {
  getOutcomeImagesBucket,
  storagePathFromPublicUrl,
} from "@/lib/ai/outcome-images"
import { buildCoverImageQuizUpdate } from "@/lib/quiz/published-snapshot"
import { revalidateLiveQuizPaths } from "@/lib/quiz/revalidate"
import type { PublishedQuizSnapshot } from "@/lib/quiz/types"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { quiz_id?: string }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const quizId = body.quiz_id

  if (!quizId) {
    return NextResponse.json({ error: "quiz_id is required." }, { status: 400 })
  }

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, author_id, cover_image_url, status, slug, published_snapshot")
    .eq("id", quizId)
    .maybeSingle()

  if (!quiz || quiz.author_id !== user.id) {
    return NextResponse.json({ error: "Quiz not found." }, { status: 404 })
  }

  if (quiz.cover_image_url) {
    const storagePath = storagePathFromPublicUrl(quiz.cover_image_url)

    if (storagePath?.startsWith(`authors/${user.id}/`)) {
      await supabase.storage.from(getOutcomeImagesBucket()).remove([storagePath])
    }
  }

  const update = buildCoverImageQuizUpdate(
    {
      status: quiz.status,
      published_snapshot: quiz.published_snapshot as PublishedQuizSnapshot | null,
    },
    null
  )

  const { error } = await supabase
    .from("quizzes")
    .update(update)
    .eq("id", quizId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  revalidateLiveQuizPaths(quizId, quiz.slug)

  return NextResponse.json({ success: true })
}

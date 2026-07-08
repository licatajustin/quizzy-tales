import { NextResponse } from "next/server"

import {
  buildCoverImagePath,
  detectImageExtension,
  getOutcomeImagesBucket,
  getPublicStorageUrl,
  storagePathFromPublicUrl,
} from "@/lib/ai/outcome-images"
import { buildCoverImageQuizUpdate } from "@/lib/quiz/published-snapshot"
import { revalidateLiveQuizPaths } from "@/lib/quiz/revalidate"
import type { PublishedQuizSnapshot } from "@/lib/quiz/types"
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
  const file = formData.get("file")

  if (!quizId || !(file instanceof File)) {
    return NextResponse.json(
      { error: "quiz_id and file are required." },
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
    .select("id, author_id, cover_image_url, status, slug, published_snapshot")
    .eq("id", quizId)
    .maybeSingle()

  if (!quiz || quiz.author_id !== user.id) {
    return NextResponse.json({ error: "Quiz not found." }, { status: 404 })
  }

  if (quiz.cover_image_url) {
    const existingPath = storagePathFromPublicUrl(quiz.cover_image_url)

    if (existingPath?.startsWith(`authors/${user.id}/`)) {
      await supabase.storage.from(getOutcomeImagesBucket()).remove([existingPath])
    }
  }

  const storagePath = buildCoverImagePath(user.id, quizId, extension)
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
  const update = buildCoverImageQuizUpdate(
    {
      status: quiz.status,
      published_snapshot: quiz.published_snapshot as PublishedQuizSnapshot | null,
    },
    imageUrl
  )

  const { error: updateError } = await supabase
    .from("quizzes")
    .update(update)
    .eq("id", quizId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  revalidateLiveQuizPaths(quizId, quiz.slug)

  return NextResponse.json({ image_url: imageUrl })
}

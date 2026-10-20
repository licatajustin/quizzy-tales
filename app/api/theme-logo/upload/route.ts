import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"

import {
  buildThemeLogoPath,
  detectImageExtension,
  getOutcomeImagesBucket,
  getPublicStorageUrl,
  storagePathFromPublicUrl,
} from "@/lib/ai/outcome-images"
import { isPlainObject, normalizeQuizTheme, persistQuizTheme } from "@/lib/quiz/theme"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseUrl } from "@/lib/supabase/env"

function revalidateQuizEditor(quizId: string) {
  revalidatePath(`/dashboard/quizzes/${quizId}`)
  revalidatePath(`/dashboard/quizzes/${quizId}/preview`)
}

function readSubmittedTheme(value: unknown, fallback: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return fallback
  }

  try {
    const parsed = JSON.parse(value) as unknown
    return isPlainObject(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

async function removeOwnedLogo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  logoUrl: string | null
) {
  if (!logoUrl) {
    return
  }

  const storagePath = storagePathFromPublicUrl(logoUrl)
  if (storagePath?.startsWith(`authors/${userId}/`)) {
    await supabase.storage.from(getOutcomeImagesBucket()).remove([storagePath])
  }
}

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
    .select("id, author_id, theme, slug")
    .eq("id", quizId)
    .maybeSingle()

  if (!quiz || quiz.author_id !== user.id) {
    return NextResponse.json({ error: "Quiz not found." }, { status: 404 })
  }

  const previousLogo = normalizeQuizTheme(quiz.theme).logo_url
  await removeOwnedLogo(supabase, user.id, previousLogo)

  const storagePath = buildThemeLogoPath(user.id, quizId, extension)
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
  const submitted = readSubmittedTheme(formData.get("theme"), quiz.theme)
  const theme = persistQuizTheme(
    isPlainObject(submitted)
      ? { ...submitted, logo_url: imageUrl }
      : { logo_url: imageUrl }
  )

  const { error: updateError } = await supabase
    .from("quizzes")
    .update({ theme })
    .eq("id", quizId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  revalidateQuizEditor(quizId)

  return NextResponse.json({ logo_url: imageUrl, theme })
}

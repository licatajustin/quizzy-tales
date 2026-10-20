import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"

import {
  getOutcomeImagesBucket,
  storagePathFromPublicUrl,
} from "@/lib/ai/outcome-images"
import {
  isPlainObject,
  normalizeQuizTheme,
  persistQuizTheme,
} from "@/lib/quiz/theme"
import { createClient } from "@/lib/supabase/server"

function revalidateQuizEditor(quizId: string) {
  revalidatePath(`/dashboard/quizzes/${quizId}`)
  revalidatePath(`/dashboard/quizzes/${quizId}/preview`)
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { quiz_id?: string; theme?: unknown }

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
    .select("id, author_id, theme")
    .eq("id", quizId)
    .maybeSingle()

  if (!quiz || quiz.author_id !== user.id) {
    return NextResponse.json({ error: "Quiz not found." }, { status: 404 })
  }

  const previousLogo = normalizeQuizTheme(quiz.theme).logo_url
  if (previousLogo) {
    const storagePath = storagePathFromPublicUrl(previousLogo)
    if (storagePath?.startsWith(`authors/${user.id}/`)) {
      await supabase.storage.from(getOutcomeImagesBucket()).remove([storagePath])
    }
  }

  const submitted = isPlainObject(body.theme) ? body.theme : quiz.theme
  const theme = persistQuizTheme({ ...submitted, logo_url: null })

  const { error } = await supabase
    .from("quizzes")
    .update({ theme })
    .eq("id", quizId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  revalidateQuizEditor(quizId)

  return NextResponse.json({ success: true, theme })
}

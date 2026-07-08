"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import type { GeneratedQuiz, QuizRevisionPatch } from "@/lib/ai/schemas"
import { saveBuilderQuiz, saveGeneratedQuiz, applyQuizRevisionPatch } from "@/lib/quiz/ai-save"
import type { QuizBuilderDraft } from "@/lib/quiz/builder/types"
import { isBuilderDraftValid } from "@/lib/quiz/builder/types"
import { getSubscriptionAccessForUser } from "@/lib/subscription-server"
import { createClient } from "@/lib/supabase/server"

export type ActionResult = {
  error?: string
  success?: boolean
  quizId?: string
}

async function requireAuthor() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  return { supabase, userId: user.id }
}

export async function persistQuizBuilderDraft(
  draft: QuizBuilderDraft
): Promise<ActionResult> {
  const { supabase, userId } = await requireAuthor()

  if (!isBuilderDraftValid(draft)) {
    return { error: "Complete all required quiz fields before going live." }
  }

  try {
    const { quizId } = await saveBuilderQuiz(supabase, userId, draft)

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/quizzes")

    return { success: true, quizId }
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not save quiz.",
    }
  }
}

export async function saveQuizBuilderDraft(
  draft: QuizBuilderDraft
): Promise<ActionResult> {
  const { supabase, userId } = await requireAuthor()
  const access = await getSubscriptionAccessForUser(supabase, userId)

  if (!access?.canUseAI) {
    return { error: "AI trial limit reached. Start the author plan to unlock more AI." }
  }

  if (!isBuilderDraftValid(draft)) {
    return { error: "Complete all required quiz fields before creating." }
  }

  try {
    const { quizId } = await saveBuilderQuiz(supabase, userId, draft)

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/quizzes")
    redirect(`/dashboard/quizzes/${quizId}`)
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not create quiz.",
    }
  }
}

export async function saveAiGeneratedQuiz(input: {
  bookTitle: string
  slug?: string
  generated: GeneratedQuiz
}): Promise<ActionResult> {
  const { supabase, userId } = await requireAuthor()
  const access = await getSubscriptionAccessForUser(supabase, userId)

  if (!access?.canUseAI) {
    return { error: "AI trial limit reached. Start the author plan to unlock more AI." }
  }

  try {
    const { quizId } = await saveGeneratedQuiz(supabase, userId, {
      bookTitle: input.bookTitle,
      generated: input.generated,
      slug: input.slug,
    })

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/quizzes")
    redirect(`/dashboard/quizzes/${quizId}`)
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not save generated quiz.",
    }
  }
}

export async function applyAiRevisionPatch(
  quizId: string,
  patch: QuizRevisionPatch
): Promise<ActionResult> {
  const { supabase, userId } = await requireAuthor()
  const access = await getSubscriptionAccessForUser(supabase, userId)

  if (!access?.canUseAI) {
    return { error: "AI revision requires at least one live quiz subscription." }
  }

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("author_id, slug")
    .eq("id", quizId)
    .maybeSingle()

  if (!quiz || quiz.author_id !== userId) {
    return { error: "Quiz not found." }
  }

  try {
    await applyQuizRevisionPatch(supabase, quizId, patch)
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not apply AI changes.",
    }
  }

  revalidatePath(`/dashboard/quizzes/${quizId}`)
  revalidatePath(`/dashboard/quizzes/${quizId}/preview`)
  if (quiz.slug) {
    revalidatePath(`/q/${quiz.slug}`)
  }

  return { success: true }
}

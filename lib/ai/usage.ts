import type { SupabaseClient } from "@supabase/supabase-js"

import {
  AI_LIMITS,
  type AuthorBillingFields,
  hasTrialRemaining,
} from "@/lib/subscription"

export type AiRequestKind =
  | "generate-quiz"
  | "builder-chat"
  | "revise-quiz"
  | "portrait"

function currentUsageMonth() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
}

export async function getMonthlyAiUsage(
  supabase: SupabaseClient,
  authorId: string
) {
  const { data } = await supabase
    .from("ai_usage")
    .select("text_requests, image_requests")
    .eq("author_id", authorId)
    .eq("usage_month", currentUsageMonth())
    .maybeSingle()

  return {
    text_requests: data?.text_requests ?? 0,
    image_requests: data?.image_requests ?? 0,
  }
}

export type AiAccessCheck = {
  allowed: boolean
  error?: "SUBSCRIPTION_REQUIRED" | "AI_LIMIT_REACHED" | "TRIAL_REVISE_BLOCKED"
  remainingText?: number
  remainingImages?: number
}

export async function checkAiAccess(
  supabase: SupabaseClient,
  authorId: string,
  author: AuthorBillingFields,
  paidLiveSlots: number,
  kind: AiRequestKind
): Promise<AiAccessCheck> {
  if (kind === "revise-quiz" && paidLiveSlots === 0) {
    return { allowed: false, error: "TRIAL_REVISE_BLOCKED" }
  }

  if (kind === "portrait" && paidLiveSlots === 0) {
    return { allowed: false, error: "SUBSCRIPTION_REQUIRED" }
  }

  if (paidLiveSlots > 0) {
    const usage = await getMonthlyAiUsage(supabase, authorId)
    const textLimit = AI_LIMITS.paidTextPerSlot * paidLiveSlots
    const imageLimit = AI_LIMITS.paidImagesPerSlot * paidLiveSlots
    const remainingText = Math.max(0, textLimit - usage.text_requests)
    const remainingImages = Math.max(0, imageLimit - usage.image_requests)

    if (kind === "portrait") {
      return remainingImages > 0
        ? { allowed: true, remainingText, remainingImages }
        : { allowed: false, error: "AI_LIMIT_REACHED", remainingText, remainingImages }
    }

    return remainingText > 0
      ? { allowed: true, remainingText, remainingImages }
      : { allowed: false, error: "AI_LIMIT_REACHED", remainingText, remainingImages }
  }

  if (!hasTrialRemaining(author)) {
    return { allowed: false, error: "SUBSCRIPTION_REQUIRED" }
  }

  if (kind === "generate-quiz") {
    return author.ai_trial_generate_used
      ? { allowed: false, error: "AI_LIMIT_REACHED", remainingText: 0 }
      : {
          allowed: true,
          remainingText:
            AI_LIMITS.trialBuilderMessages - author.ai_trial_builder_messages,
        }
  }

  if (kind === "builder-chat") {
    const remaining =
      AI_LIMITS.trialBuilderMessages - author.ai_trial_builder_messages
    return remaining > 0
      ? { allowed: true, remainingText: remaining }
      : { allowed: false, error: "AI_LIMIT_REACHED", remainingText: 0 }
  }

  return { allowed: false, error: "SUBSCRIPTION_REQUIRED" }
}

export async function recordAiUsage(
  supabase: SupabaseClient,
  authorId: string,
  author: AuthorBillingFields,
  paidLiveSlots: number,
  kind: AiRequestKind
) {
  if (paidLiveSlots > 0) {
    const month = currentUsageMonth()
    const usage = await getMonthlyAiUsage(supabase, authorId)

    const nextText =
      kind === "portrait" ? usage.text_requests : usage.text_requests + 1
    const nextImages =
      kind === "portrait" ? usage.image_requests + 1 : usage.image_requests

    await supabase.from("ai_usage").upsert(
      {
        author_id: authorId,
        usage_month: month,
        text_requests: nextText,
        image_requests: nextImages,
      },
      { onConflict: "author_id,usage_month" }
    )
    return
  }

  if (kind === "generate-quiz") {
    await supabase
      .from("authors")
      .update({ ai_trial_generate_used: true })
      .eq("id", authorId)
    return
  }

  if (kind === "builder-chat") {
    await supabase
      .from("authors")
      .update({
        ai_trial_builder_messages: author.ai_trial_builder_messages + 1,
      })
      .eq("id", authorId)
  }
}

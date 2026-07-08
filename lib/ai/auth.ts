import { checkAiAccess, recordAiUsage, type AiRequestKind } from "@/lib/ai/usage"
import { getAuthorBillingProfile } from "@/lib/subscription-server"
import { isPaidSubscriptionStatus } from "@/lib/subscription"
import { createClient } from "@/lib/supabase/server"

export async function requireAiAccessForKind(kind: AiRequestKind) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized", status: 401 as const }
  }

  const author = await getAuthorBillingProfile(supabase, user.id)

  if (!author) {
    return { error: "Author profile not found", status: 403 as const }
  }

  const paidLiveSlots = isPaidSubscriptionStatus(author.subscription_status)
    ? author.subscription_quantity
    : 0

  const access = await checkAiAccess(
    supabase,
    user.id,
    author,
    paidLiveSlots,
    kind
  )

  if (!access.allowed) {
    const status = access.error === "AI_LIMIT_REACHED" ? 429 : 403
    return {
      error: access.error ?? "SUBSCRIPTION_REQUIRED",
      status: status as 403 | 429,
      remainingText: access.remainingText,
      remainingImages: access.remainingImages,
    }
  }

  return {
    supabase,
    userId: user.id,
    author,
    paidLiveSlots,
    remainingText: access.remainingText,
    remainingImages: access.remainingImages,
  }
}

export async function recordAiUsageForKind(
  userId: string,
  kind: AiRequestKind
) {
  const supabase = await createClient()
  const author = await getAuthorBillingProfile(supabase, userId)

  if (!author) {
    return
  }

  const paidLiveSlots = isPaidSubscriptionStatus(author.subscription_status)
    ? author.subscription_quantity
    : 0

  await recordAiUsage(supabase, userId, author, paidLiveSlots, kind)
}

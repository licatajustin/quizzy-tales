export const SUBSCRIPTION_STATUSES = [
  "active",
  "inactive",
  "past_due",
  "canceled",
  "trialing",
] as const

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number]

export const GRACE_PERIOD_DAYS = 7

export const AI_LIMITS = {
  trialGenerate: 1,
  trialBuilderMessages: 10,
  paidTextPerSlot: 30,
  paidImagesPerSlot: 6,
} as const

export type AuthorBillingFields = {
  stripe_customer_id: string | null
  subscription_id: string | null
  subscription_status: SubscriptionStatus
  subscription_end_date: string | null
  subscription_cancel_at_period_end: boolean
  subscription_quantity: number
  subscription_grace_ends_at: string | null
  ai_trial_generate_used: boolean
  ai_trial_builder_messages: number
}

export type SubscriptionAccess = {
  status: SubscriptionStatus
  isPaid: boolean
  cancelAtPeriodEnd: boolean
  canCreateQuiz: boolean
  publishedQuizCount: number
  paidLiveSlots: number
  canPublishQuiz: boolean
  canUseAI: boolean
  aiTextRemaining: number
  aiImageRemaining: number
  isInGracePeriod: boolean
  graceEndsAt: string | null
  hasTrialRemaining: boolean
  hasActivePlan: boolean
  availableLiveSlots: number
}

export function formatSubscriptionDate(iso: string | null) {
  if (!iso) {
    return null
  }

  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export function isSubscriptionCanceling(
  author: Pick<
    AuthorBillingFields,
    "subscription_status" | "subscription_cancel_at_period_end"
  >
) {
  return (
    isPaidSubscriptionStatus(author.subscription_status) &&
    author.subscription_cancel_at_period_end
  )
}

export function isPaidSubscriptionStatus(status: SubscriptionStatus) {
  return status === "active" || status === "trialing"
}

export function requiresSubscriptionCancellationBeforeAccountDelete(
  author: Pick<
    AuthorBillingFields,
    | "subscription_id"
    | "subscription_status"
    | "subscription_cancel_at_period_end"
  >
) {
  if (!author.subscription_id) {
    return false
  }

  if (isSubscriptionCanceling(author)) {
    return false
  }

  return (
    isPaidSubscriptionStatus(author.subscription_status) ||
    author.subscription_status === "past_due"
  )
}

export function isInGracePeriod(
  author: Pick<AuthorBillingFields, "subscription_grace_ends_at">
) {
  if (!author.subscription_grace_ends_at) {
    return false
  }

  return new Date(author.subscription_grace_ends_at).getTime() > Date.now()
}

export function hasTrialRemaining(
  author: Pick<
    AuthorBillingFields,
    "ai_trial_generate_used" | "ai_trial_builder_messages"
  >
) {
  return (
    !author.ai_trial_generate_used ||
    author.ai_trial_builder_messages < AI_LIMITS.trialBuilderMessages
  )
}

export function getPaidAiLimits(paidLiveSlots: number) {
  return {
    textLimit: AI_LIMITS.paidTextPerSlot * paidLiveSlots,
    imageLimit: AI_LIMITS.paidImagesPerSlot * paidLiveSlots,
  }
}

export function getSubscriptionAccess(
  author: AuthorBillingFields,
  publishedQuizCount: number,
  monthlyUsage?: { text_requests: number; image_requests: number }
): SubscriptionAccess {
  const isPaid = isPaidSubscriptionStatus(author.subscription_status)
  const paidLiveSlots = isPaid ? author.subscription_quantity : 0
  const graceActive = isInGracePeriod(author)
  const trialRemaining = hasTrialRemaining(author)

  const usage = monthlyUsage ?? { text_requests: 0, image_requests: 0 }
  const paidLimits = getPaidAiLimits(paidLiveSlots)

  let aiTextRemaining = 0
  let aiImageRemaining = 0

  if (paidLiveSlots > 0) {
    aiTextRemaining = Math.max(0, paidLimits.textLimit - usage.text_requests)
    aiImageRemaining = Math.max(0, paidLimits.imageLimit - usage.image_requests)
  } else if (trialRemaining) {
    aiTextRemaining = author.ai_trial_generate_used
      ? Math.max(0, AI_LIMITS.trialBuilderMessages - author.ai_trial_builder_messages)
      : AI_LIMITS.trialBuilderMessages - author.ai_trial_builder_messages + AI_LIMITS.trialGenerate
    aiImageRemaining = 0
  }

  const canUseAI =
    (paidLiveSlots > 0 && (aiTextRemaining > 0 || aiImageRemaining > 0)) ||
    (paidLiveSlots === 0 && trialRemaining)

  const canPublishQuiz = true
  const hasActivePlan = isPaid && paidLiveSlots >= 1
  const availableLiveSlots = Math.max(0, paidLiveSlots - publishedQuizCount)

  return {
    status: author.subscription_status,
    isPaid,
    cancelAtPeriodEnd: isSubscriptionCanceling(author),
    canCreateQuiz: true,
    publishedQuizCount,
    paidLiveSlots,
    canPublishQuiz,
    canUseAI,
    aiTextRemaining,
    aiImageRemaining,
    isInGracePeriod: graceActive,
    graceEndsAt: author.subscription_grace_ends_at,
    hasTrialRemaining: trialRemaining,
    hasActivePlan,
    availableLiveSlots,
  }
}

export function mapStripeSubscriptionStatus(
  status: string
): SubscriptionStatus {
  switch (status) {
    case "active":
      return "active"
    case "trialing":
      return "trialing"
    case "past_due":
      return "past_due"
    case "canceled":
    case "unpaid":
    case "incomplete":
    case "incomplete_expired":
    case "paused":
      return "canceled"
    default:
      return "inactive"
  }
}

export function graceEndsAtFromNow() {
  return new Date(
    Date.now() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
  ).toISOString()
}

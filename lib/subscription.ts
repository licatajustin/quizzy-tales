export const SUBSCRIPTION_STATUSES = [
  "active",
  "inactive",
  "past_due",
  "canceled",
  "trialing",
] as const

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number]

export type SubscriptionTier = "free" | "pro"

export const TIER_LIMITS = {
  free: {
    maxQuizzes: 1,
    canUseAI: false,
    canPublish: false,
  },
  pro: {
    maxQuizzes: Number.POSITIVE_INFINITY,
    canUseAI: true,
    canPublish: true,
  },
} as const

export type AuthorBillingFields = {
  stripe_customer_id: string | null
  subscription_id: string | null
  subscription_status: SubscriptionStatus
  subscription_end_date: string | null
  subscription_cancel_at_period_end: boolean
}

export type SubscriptionAccess = {
  tier: SubscriptionTier
  status: SubscriptionStatus
  isPaid: boolean
  cancelAtPeriodEnd: boolean
  canPublish: boolean
  canUseAI: boolean
  maxQuizzes: number
  canCreateQuiz: boolean
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

export function getSubscriptionAccess(
  author: Pick<
    AuthorBillingFields,
    "subscription_status" | "subscription_cancel_at_period_end"
  >,
  quizCount: number
): SubscriptionAccess {
  const isPaid = isPaidSubscriptionStatus(author.subscription_status)
  const tier: SubscriptionTier = isPaid ? "pro" : "free"
  const limits = TIER_LIMITS[tier]

  return {
    tier,
    status: author.subscription_status,
    isPaid,
    cancelAtPeriodEnd: isSubscriptionCanceling(author),
    canPublish: limits.canPublish,
    canUseAI: limits.canUseAI,
    maxQuizzes: limits.maxQuizzes,
    canCreateQuiz: quizCount < limits.maxQuizzes,
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

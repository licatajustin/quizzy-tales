import type { SupabaseClient, User } from "@supabase/supabase-js"

import { refreshAuthorSubscriptionFromStripe } from "@/lib/billing"
import {
  formatSubscriptionDate,
  requiresSubscriptionCancellationBeforeAccountDelete,
} from "@/lib/subscription"
import {
  getAuthorBillingProfile,
  getAuthorQuizCount,
  getPublishedQuizCount,
} from "@/lib/subscription-server"

export type AccountDeletionInfo = {
  canDelete: boolean
  requiresSubscriptionCancellation: boolean
  quizCount: number
  publishedQuizCount: number
  isCancelingAtPeriodEnd: boolean
  subscriptionEndDate: string | null
}

export type AccountDeletionInfoResult =
  | ({ error: string } & Partial<AccountDeletionInfo>)
  | AccountDeletionInfo

export async function getAccountDeletionInfo(
  supabase: SupabaseClient,
  user: User
): Promise<AccountDeletionInfoResult> {
  let author = await getAuthorBillingProfile(supabase, user.id)

  if (!author) {
    return { error: "Author profile not found." }
  }

  if (author.stripe_customer_id) {
    author = await refreshAuthorSubscriptionFromStripe(user.id, author)
  }

  const [quizCount, publishedQuizCount] = await Promise.all([
    getAuthorQuizCount(supabase, user.id),
    getPublishedQuizCount(supabase, user.id),
  ])

  const requiresSubscriptionCancellation =
    requiresSubscriptionCancellationBeforeAccountDelete(author)

  return {
    canDelete: !requiresSubscriptionCancellation,
    requiresSubscriptionCancellation,
    quizCount,
    publishedQuizCount,
    isCancelingAtPeriodEnd: author.subscription_cancel_at_period_end,
    subscriptionEndDate: formatSubscriptionDate(author.subscription_end_date),
  }
}

import type { SupabaseClient } from "@supabase/supabase-js"

import { getMonthlyAiUsage } from "@/lib/ai/usage"
import {
  getSubscriptionAccess,
  type AuthorBillingFields,
  type SubscriptionAccess,
} from "@/lib/subscription"

const AUTHOR_BILLING_SELECT =
  "stripe_customer_id, subscription_id, subscription_status, subscription_end_date, subscription_cancel_at_period_end, subscription_quantity, subscription_grace_ends_at, ai_trial_generate_used, ai_trial_builder_messages"

export async function getAuthorBillingProfile(
  supabase: SupabaseClient,
  userId: string
) {
  const { data, error } = await supabase
    .from("authors")
    .select(AUTHOR_BILLING_SELECT)
    .eq("id", userId)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return data as AuthorBillingFields
}

export async function getAuthorQuizCount(
  supabase: SupabaseClient,
  userId: string
) {
  const { count, error } = await supabase
    .from("quizzes")
    .select("*", { count: "exact", head: true })
    .eq("author_id", userId)

  if (error) {
    return 0
  }

  return count ?? 0
}

export async function getPublishedQuizCount(
  supabase: SupabaseClient,
  userId: string
) {
  const { count, error } = await supabase
    .from("quizzes")
    .select("*", { count: "exact", head: true })
    .eq("author_id", userId)
    .eq("status", "published")

  if (error) {
    return 0
  }

  return count ?? 0
}

export async function getSubscriptionAccessForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<SubscriptionAccess | null> {
  const author = await getAuthorBillingProfile(supabase, userId)

  if (!author) {
    return null
  }

  const [publishedQuizCount, monthlyUsage] = await Promise.all([
    getPublishedQuizCount(supabase, userId),
    getMonthlyAiUsage(supabase, userId),
  ])

  return getSubscriptionAccess(author, publishedQuizCount, monthlyUsage)
}

import type { SupabaseClient } from "@supabase/supabase-js"

import {
  getSubscriptionAccess,
  type AuthorBillingFields,
  type SubscriptionAccess,
} from "@/lib/subscription"

export async function getAuthorBillingProfile(
  supabase: SupabaseClient,
  userId: string
) {
  const { data, error } = await supabase
    .from("authors")
    .select(
      "stripe_customer_id, subscription_id, subscription_status, subscription_end_date, subscription_cancel_at_period_end"
    )
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

export async function getSubscriptionAccessForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<SubscriptionAccess | null> {
  const author = await getAuthorBillingProfile(supabase, userId)

  if (!author) {
    return null
  }

  const quizCount = await getAuthorQuizCount(supabase, userId)
  return getSubscriptionAccess(author, quizCount)
}

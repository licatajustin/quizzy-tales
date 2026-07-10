import type Stripe from "stripe"

import { graceEndsAtFromNow } from "@/lib/subscription"
import { executePublishQuiz } from "@/lib/quiz/publish-billing"
import { createAdminClient } from "@/lib/supabase/admin"
import { syncAuthorSubscriptionToDatabase } from "@/lib/stripe/sync-subscription"

export async function syncAuthorSubscriptionFromWebhook(
  authorId: string,
  subscription: Stripe.Subscription
) {
  await syncAuthorSubscriptionToDatabase(authorId, subscription)
}

export async function clearAuthorSubscriptionFromWebhook(authorId: string) {
  const admin = createAdminClient()

  await admin
    .from("authors")
    .update({
      subscription_id: null,
      subscription_status: "inactive",
      subscription_end_date: null,
      subscription_cancel_at_period_end: false,
      subscription_quantity: 0,
      subscription_grace_ends_at: graceEndsAtFromNow(),
    })
    .eq("id", authorId)
}

export async function publishQuizAfterCheckoutFromWebhook(
  authorId: string,
  quizId: string
) {
  const admin = createAdminClient()
  const { data: quiz } = await admin
    .from("quizzes")
    .select("author_id")
    .eq("id", quizId)
    .maybeSingle()

  if (!quiz || quiz.author_id !== authorId) {
    return
  }

  await executePublishQuiz(admin, quizId)
}

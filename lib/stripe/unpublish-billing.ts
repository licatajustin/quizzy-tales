import { syncAuthorSubscriptionToDatabase } from "@/lib/stripe/sync-subscription"
import { updateSubscriptionQuantity } from "@/lib/stripe/subscription-quantity"
import { isPaidSubscriptionStatus } from "@/lib/subscription"
import {
  getAuthorBillingProfile,
  getPublishedQuizCount,
} from "@/lib/subscription-server"
import { createClient } from "@/lib/supabase/server"

export async function decrementSubscriptionOnUnpublish(
  userId: string,
  author: Awaited<ReturnType<typeof getAuthorBillingProfile>>
) {
  if (
    !author?.subscription_id ||
    !isPaidSubscriptionStatus(author.subscription_status)
  ) {
    return
  }

  const supabase = await createClient()
  const publishedCount = await getPublishedQuizCount(supabase, userId)
  const nextQuantity = Math.max(1, publishedCount)

  if (nextQuantity === author.subscription_quantity) {
    return
  }

  const subscription = await updateSubscriptionQuantity(
    author.subscription_id,
    nextQuantity
  )
  await syncAuthorSubscriptionToDatabase(userId, subscription)
}

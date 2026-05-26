import type Stripe from "stripe"

import { getSubscriptionSyncFields } from "@/lib/billing"
import { createAdminClient } from "@/lib/supabase/admin"

export async function findAuthorIdForSubscription(
  subscription: Stripe.Subscription
): Promise<string | null> {
  if (subscription.metadata?.author_id) {
    return subscription.metadata.author_id
  }

  const admin = createAdminClient()
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id

  if (customerId) {
    const { data } = await admin
      .from("authors")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle()

    if (data?.id) {
      return data.id
    }
  }

  const { data } = await admin
    .from("authors")
    .select("id")
    .eq("subscription_id", subscription.id)
    .maybeSingle()

  return data?.id ?? null
}

export async function syncAuthorSubscriptionToDatabase(
  authorId: string,
  subscription: Stripe.Subscription
) {
  const admin = createAdminClient()
  const fields = getSubscriptionSyncFields(subscription)

  const { error } = await admin.from("authors").update(fields).eq("id", authorId)

  if (error) {
    throw new Error(
      `Failed to sync subscription for author ${authorId}: ${error.message}`
    )
  }
}

export async function syncAuthorSubscriptionByCustomerId(
  customerId: string,
  subscription: Stripe.Subscription
) {
  const admin = createAdminClient()
  const fields = getSubscriptionSyncFields(subscription)

  const { error } = await admin
    .from("authors")
    .update(fields)
    .eq("stripe_customer_id", customerId)

  if (error) {
    throw new Error(
      `Failed to sync subscription for customer ${customerId}: ${error.message}`
    )
  }
}

export async function syncAuthorSubscriptionFromStripe(
  subscriptionId: string
) {
  const { getStripe } = await import("@/lib/stripe/client")
  const stripe = getStripe()
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const authorId = await findAuthorIdForSubscription(subscription)

  if (authorId) {
    await syncAuthorSubscriptionToDatabase(authorId, subscription)
    return { authorId, subscription }
  }

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id

  if (customerId) {
    await syncAuthorSubscriptionByCustomerId(customerId, subscription)
  }

  return { authorId: null, subscription }
}

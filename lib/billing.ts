import type Stripe from "stripe"

import type { ProductId } from "@/lib/products"
import { getBillingProducts } from "@/lib/products"
import { getStripe } from "@/lib/stripe/client"
import {
  graceEndsAtFromNow,
  isPaidSubscriptionStatus,
  mapStripeSubscriptionStatus,
  type AuthorBillingFields,
} from "@/lib/subscription"

export type CurrentPlanId = "none" | ProductId

function getSubscriptionPeriodEnd(subscription: Stripe.Subscription) {
  const itemPeriodEnd = subscription.items.data[0]?.current_period_end

  if (itemPeriodEnd) {
    return itemPeriodEnd
  }

  if (
    "current_period_end" in subscription &&
    typeof subscription.current_period_end === "number"
  ) {
    return subscription.current_period_end
  }

  return null
}

export function isSubscriptionScheduledForCancellation(
  subscription: Stripe.Subscription
) {
  if (subscription.cancel_at_period_end) {
    return true
  }

  const now = Math.floor(Date.now() / 1000)

  if (
    subscription.cancel_at != null &&
    subscription.cancel_at > now &&
    subscription.status !== "canceled"
  ) {
    return true
  }

  if (subscription.status === "active" && subscription.canceled_at != null) {
    return true
  }

  return false
}

function getSubscriptionQuantity(subscription: Stripe.Subscription) {
  return subscription.items.data[0]?.quantity ?? 0
}

function resolveGraceEndsAt(mappedStatus: ReturnType<typeof mapStripeSubscriptionStatus>) {
  if (mappedStatus === "active" || mappedStatus === "trialing") {
    return null
  }

  if (mappedStatus === "past_due") {
    return graceEndsAtFromNow()
  }

  return null
}

export function getSubscriptionSyncFields(subscription: Stripe.Subscription) {
  const periodEnd = getSubscriptionPeriodEnd(subscription)
  const endTimestamp = periodEnd ?? subscription.cancel_at ?? null
  const endDate = endTimestamp
    ? new Date(endTimestamp * 1000).toISOString()
    : null
  const mappedStatus = mapStripeSubscriptionStatus(subscription.status)

  return {
    subscription_id: subscription.id,
    subscription_status: mappedStatus,
    subscription_end_date: endDate,
    subscription_cancel_at_period_end:
      isSubscriptionScheduledForCancellation(subscription),
    subscription_quantity: getSubscriptionQuantity(subscription),
    subscription_grace_ends_at: resolveGraceEndsAt(mappedStatus),
  }
}

function pickActiveSubscription(subscriptions: Stripe.Subscription[]) {
  const paidStatuses = new Set(["active", "trialing", "past_due"])

  return (
    subscriptions.find((subscription) => paidStatuses.has(subscription.status)) ??
    subscriptions[0] ??
    null
  )
}

export async function refreshAuthorSubscriptionFromStripe(
  userId: string,
  author: AuthorBillingFields
): Promise<AuthorBillingFields> {
  try {
    const { syncAuthorSubscriptionToDatabase } = await import(
      "@/lib/stripe/sync-subscription"
    )
    const { getStripe } = await import("@/lib/stripe/client")
    const stripe = getStripe()

    let subscription: Stripe.Subscription | null = null

    if (author.subscription_id) {
      subscription = await stripe.subscriptions.retrieve(author.subscription_id)
    } else if (author.stripe_customer_id) {
      const { data } = await stripe.subscriptions.list({
        customer: author.stripe_customer_id,
        status: "all",
        limit: 10,
      })

      subscription = pickActiveSubscription(data)
    }

    if (!subscription) {
      return author
    }

    await syncAuthorSubscriptionToDatabase(userId, subscription)

    return {
      ...author,
      ...getSubscriptionSyncFields(subscription),
    }
  } catch (error) {
    console.error("Failed to refresh subscription from Stripe:", error)
    return author
  }
}

export async function syncAuthorSubscriptionFromCheckoutSession(
  userId: string,
  sessionId: string
) {
  const { getStripe } = await import("@/lib/stripe/client")
  const { syncAuthorSubscriptionToDatabase } = await import(
    "@/lib/stripe/sync-subscription"
  )
  const stripe = getStripe()
  const session = await stripe.checkout.sessions.retrieve(sessionId)

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id

  if (!subscriptionId) {
    return null
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  await syncAuthorSubscriptionToDatabase(userId, subscription)

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id

  if (customerId) {
    const { createAdminClient } = await import("@/lib/supabase/admin")
    const admin = createAdminClient()

    await admin
      .from("authors")
      .update({ stripe_customer_id: customerId })
      .eq("id", userId)
  }

  return getSubscriptionSyncFields(subscription)
}

export async function getCurrentPlanId(
  author: AuthorBillingFields
): Promise<CurrentPlanId> {
  if (
    !isPaidSubscriptionStatus(author.subscription_status) ||
    !author.subscription_id ||
    author.subscription_quantity === 0
  ) {
    return "none"
  }

  try {
    const stripe = getStripe()
    const subscription = await stripe.subscriptions.retrieve(author.subscription_id)
    const priceId = subscription.items.data[0]?.price.id
    const match = getBillingProducts().find((product) => product.priceId === priceId)

    return match?.id ?? "quizzytales-live-quiz-monthly"
  } catch {
    return "quizzytales-live-quiz-monthly"
  }
}

export function getPlanLabel(planId: CurrentPlanId, quantity = 0) {
  if (planId === "none" || quantity === 0) {
    return "Free"
  }

  if (quantity === 1) {
    return "Author plan"
  }

  return `Author plan · ${quantity} slots`
}

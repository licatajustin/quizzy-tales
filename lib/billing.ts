import type Stripe from "stripe"

import type { ProductId } from "@/lib/products"
import { getBillingProducts } from "@/lib/products"
import { getStripe } from "@/lib/stripe/client"
import {
  isPaidSubscriptionStatus,
  mapStripeSubscriptionStatus,
  type AuthorBillingFields,
} from "@/lib/subscription"

export type CurrentPlanId = "free" | ProductId

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

export function getSubscriptionSyncFields(subscription: Stripe.Subscription) {
  const periodEnd = getSubscriptionPeriodEnd(subscription)
  const endTimestamp = periodEnd ?? subscription.cancel_at ?? null
  const endDate = endTimestamp
    ? new Date(endTimestamp * 1000).toISOString()
    : null

  return {
    subscription_id: subscription.id,
    subscription_status: mapStripeSubscriptionStatus(subscription.status),
    subscription_end_date: endDate,
    subscription_cancel_at_period_end:
      isSubscriptionScheduledForCancellation(subscription),
  }
}

export async function refreshAuthorSubscriptionFromStripe(
  userId: string,
  author: AuthorBillingFields
): Promise<AuthorBillingFields> {
  if (!author.subscription_id) {
    return author
  }

  try {
    const { syncAuthorSubscriptionToDatabase } = await import(
      "@/lib/stripe/sync-subscription"
    )
    const { getStripe } = await import("@/lib/stripe/client")
    const stripe = getStripe()
    const subscription = await stripe.subscriptions.retrieve(
      author.subscription_id
    )

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

export async function getCurrentPlanId(
  author: AuthorBillingFields
): Promise<CurrentPlanId> {
  if (
    !isPaidSubscriptionStatus(author.subscription_status) ||
    !author.subscription_id
  ) {
    return "free"
  }

  try {
    const stripe = getStripe()
    const subscription = await stripe.subscriptions.retrieve(author.subscription_id)
    const priceId = subscription.items.data[0]?.price.id
    const match = getBillingProducts().find((product) => product.priceId === priceId)

    return match?.id ?? "quizzytales-monthly"
  } catch {
    return "quizzytales-monthly"
  }
}

export function getPlanLabel(planId: CurrentPlanId) {
  if (planId === "free") {
    return "Free"
  }

  const product = getBillingProducts().find((entry) => entry.id === planId)
  if (!product) {
    return "Pro"
  }

  return planId === "quizzytales-yearly" ? "Pro (Annual)" : "Pro (Monthly)"
}

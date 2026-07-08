import type Stripe from "stripe"

import { getLiveQuizPriceId } from "@/lib/products"
import { getStripe } from "@/lib/stripe/client"

export async function getAuthorSubscriptionItem(subscriptionId: string) {
  const stripe = getStripe()
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const item = subscription.items.data[0]

  if (!item) {
    throw new Error("Subscription has no line items.")
  }

  return { subscription, item }
}

export async function updateSubscriptionQuantity(
  subscriptionId: string,
  quantity: number
) {
  const stripe = getStripe()
  const { item } = await getAuthorSubscriptionItem(subscriptionId)

  return stripe.subscriptions.update(subscriptionId, {
    items: [{ id: item.id, quantity }],
    proration_behavior: "create_prorations",
  })
}

export async function cancelSubscription(subscriptionId: string) {
  const stripe = getStripe()
  return stripe.subscriptions.cancel(subscriptionId)
}

export function buildLiveQuizLineItem(quantity: number) {
  return {
    price: getLiveQuizPriceId(),
    quantity,
  }
}

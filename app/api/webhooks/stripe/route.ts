import { NextResponse } from "next/server"
import type Stripe from "stripe"

import {
  clearAuthorSubscription,
  syncAuthorSubscription,
} from "@/app/actions/stripe"
import {
  findAuthorIdForSubscription,
  syncAuthorSubscriptionByCustomerId,
  syncAuthorSubscriptionToDatabase,
} from "@/lib/stripe/sync-subscription"
import { getStripe } from "@/lib/stripe/client"
import { getStripeWebhookSecret } from "@/lib/stripe/env"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"

async function updateAuthorByCustomerId(
  customerId: string,
  fields: {
    subscription_id?: string | null
    subscription_status?: string
    subscription_end_date?: string | null
    subscription_cancel_at_period_end?: boolean
  }
) {
  const admin = createAdminClient()

  await admin
    .from("authors")
    .update(fields)
    .eq("stripe_customer_id", customerId)
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const authorId = session.metadata?.author_id
  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id

  if (!authorId || !customerId || !subscriptionId) {
    return
  }

  const stripe = getStripe()
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  await syncAuthorSubscription(authorId, subscription)

  const admin = createAdminClient()
  await admin
    .from("authors")
    .update({ stripe_customer_id: customerId })
    .eq("id", authorId)
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const stripe = getStripe()
  const fullSubscription = await stripe.subscriptions.retrieve(subscription.id)
  const authorId = await findAuthorIdForSubscription(fullSubscription)

  if (authorId) {
    await syncAuthorSubscriptionToDatabase(authorId, fullSubscription)
    return
  }

  const customerId =
    typeof fullSubscription.customer === "string"
      ? fullSubscription.customer
      : fullSubscription.customer.id

  if (!customerId) {
    return
  }

  await syncAuthorSubscriptionByCustomerId(customerId, fullSubscription)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const authorId = subscription.metadata?.author_id
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id

  if (authorId) {
    await clearAuthorSubscription(authorId)
    return
  }

  if (!customerId) {
    return
  }

  await updateAuthorByCustomerId(customerId, {
    subscription_id: null,
    subscription_status: "inactive",
    subscription_end_date: null,
    subscription_cancel_at_period_end: false,
  })
}

export async function POST(request: Request) {
  const stripe = getStripe()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  const body = await request.text()

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      getStripeWebhookSecret()
    )
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object)
        break
      case "customer.subscription.updated":
        await handleSubscriptionChange(event.data.object)
        break
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object)
        break
      default:
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Stripe webhook handler error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}

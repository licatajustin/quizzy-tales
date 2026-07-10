"use server"

import { redirect } from "next/navigation"

import { getStripe } from "@/lib/stripe/client"
import { getSiteUrl } from "@/lib/stripe/env"
import {
  buildLiveQuizLineItem,
  updateSubscriptionQuantity,
} from "@/lib/stripe/subscription-quantity"
import {
  getAuthorBillingProfile,
  getPublishedQuizCount,
} from "@/lib/subscription-server"
import { createClient } from "@/lib/supabase/server"
import { isPaidSubscriptionStatus } from "@/lib/subscription"

export type StripeActionResult = {
  error?: string
  url?: string
}

async function requireAuthenticatedAuthor() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const author = await getAuthorBillingProfile(supabase, user.id)

  if (!author) {
    throw new Error("Author profile not found")
  }

  return { supabase, user, author }
}

async function ensureStripeCustomer(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  email: string | undefined,
  existingCustomerId: string | null
) {
  if (existingCustomerId) {
    return existingCustomerId
  }

  const stripe = getStripe()
  const customer = await stripe.customers.create({
    email: email ?? undefined,
    metadata: { author_id: userId },
  })

  await supabase
    .from("authors")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId)

  return customer.id
}

export async function startSubscriptionCheckout(
  returnPath = "/dashboard/settings/billing"
): Promise<StripeActionResult> {
  const { supabase, user, author } = await requireAuthenticatedAuthor()

  if (isPaidSubscriptionStatus(author.subscription_status)) {
    return { error: "You already have an active plan." }
  }

  const stripe = getStripe()
  const customerId = await ensureStripeCustomer(
    supabase,
    user.id,
    user.email,
    author.stripe_customer_id
  )

  const siteUrl = getSiteUrl()

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [buildLiveQuizLineItem(1)],
    allow_promotion_codes: true,
    success_url: `${siteUrl}${returnPath}?billing=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}${returnPath}`,
    metadata: {
      author_id: user.id,
      intent: "subscribe",
    },
    subscription_data: {
      metadata: {
        author_id: user.id,
      },
    },
  })

  if (!session.url) {
    return { error: "Could not start checkout." }
  }

  return { url: session.url }
}

export async function startPublishCheckout(
  quizId: string
): Promise<StripeActionResult> {
  const { supabase, user, author } = await requireAuthenticatedAuthor()
  const stripe = getStripe()

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, author_id")
    .eq("id", quizId)
    .maybeSingle()

  if (!quiz || quiz.author_id !== user.id) {
    return { error: "Quiz not found." }
  }

  const customerId = await ensureStripeCustomer(
    supabase,
    user.id,
    user.email,
    author.stripe_customer_id
  )

  const siteUrl = getSiteUrl()
  const quizPath = `/dashboard/quizzes/${quizId}`

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [buildLiveQuizLineItem(1)],
    allow_promotion_codes: true,
    success_url: `${siteUrl}${quizPath}?billing=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}${quizPath}`,
    metadata: {
      author_id: user.id,
      quiz_id: quizId,
      intent: "publish",
    },
    subscription_data: {
      metadata: {
        author_id: user.id,
      },
    },
  })

  if (!session.url) {
    return { error: "Could not start checkout." }
  }

  return { url: session.url }
}

export async function incrementSubscriptionForPublish(
  quizId: string
): Promise<StripeActionResult> {
  const { supabase, user, author } = await requireAuthenticatedAuthor()

  if (!author.subscription_id || !isPaidSubscriptionStatus(author.subscription_status)) {
    return { error: "No active subscription found." }
  }

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, author_id, status")
    .eq("id", quizId)
    .maybeSingle()

  if (!quiz || quiz.author_id !== user.id) {
    return { error: "Quiz not found." }
  }

  if (quiz.status === "published") {
    return { error: "Quiz is already live." }
  }

  const publishedCount = await getPublishedQuizCount(supabase, user.id)
  const nextQuantity = publishedCount + 1

  if (nextQuantity <= author.subscription_quantity) {
    return { error: "Subscription already covers this quiz." }
  }

  try {
    const { syncAuthorSubscriptionToDatabase } = await import(
      "@/lib/stripe/sync-subscription"
    )
    const subscription = await updateSubscriptionQuantity(
      author.subscription_id,
      nextQuantity
    )
    await syncAuthorSubscriptionToDatabase(user.id, subscription)
    return {}
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not update subscription.",
    }
  }
}

export async function syncCheckoutSession(
  sessionId: string
): Promise<StripeActionResult> {
  const { user } = await requireAuthenticatedAuthor()

  try {
    const { syncAuthorSubscriptionFromCheckoutSession } = await import(
      "@/lib/billing"
    )
    await syncAuthorSubscriptionFromCheckoutSession(user.id, sessionId)
    return {}
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not sync subscription after checkout.",
    }
  }
}

export async function createCustomerPortalSession(): Promise<StripeActionResult> {
  const { author } = await requireAuthenticatedAuthor()

  if (!author.stripe_customer_id) {
    return { error: "No billing account found yet." }
  }

  const stripe = getStripe()
  const session = await stripe.billingPortal.sessions.create({
    customer: author.stripe_customer_id,
    return_url: `${getSiteUrl()}/dashboard/settings/billing`,
  })

  return { url: session.url }
}

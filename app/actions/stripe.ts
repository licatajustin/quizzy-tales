"use server"

import { redirect } from "next/navigation"
import type Stripe from "stripe"

import { getBillingProduct, type ProductId } from "@/lib/products"
import { getStripe } from "@/lib/stripe/client"
import { getSiteUrl } from "@/lib/stripe/env"
import {
  getAuthorBillingProfile,
  getAuthorQuizCount,
} from "@/lib/subscription-server"
import { createClient } from "@/lib/supabase/server"

export type StripeActionResult = {
  error?: string
  clientSecret?: string
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

export async function startCheckoutSession(
  productId: ProductId
): Promise<StripeActionResult> {
  const { supabase, user, author } = await requireAuthenticatedAuthor()
  const product = getBillingProduct(productId)
  const stripe = getStripe()

  const customerId = await ensureStripeCustomer(
    supabase,
    user.id,
    user.email,
    author.stripe_customer_id
  )

  const session = await stripe.checkout.sessions.create({
    ui_mode: "embedded_page",
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: product.priceId, quantity: 1 }],
    return_url: `${getSiteUrl()}/dashboard/settings/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    metadata: {
      author_id: user.id,
      product_id: productId,
    },
    subscription_data: {
      metadata: {
        author_id: user.id,
      },
    },
  })

  if (!session.client_secret) {
    return { error: "Could not start checkout." }
  }

  return { clientSecret: session.client_secret }
}

export async function createCustomerPortalSession(): Promise<StripeActionResult> {
  const { supabase, user, author } = await requireAuthenticatedAuthor()

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

export async function getSubscriptionStatus() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const author = await getAuthorBillingProfile(supabase, user.id)

  if (!author) {
    return null
  }

  const quizCount = await getAuthorQuizCount(supabase, user.id)

  return {
    author,
    quizCount,
  }
}

export async function syncAuthorSubscription(
  authorId: string,
  subscription: Stripe.Subscription
) {
  const { syncAuthorSubscriptionToDatabase } = await import(
    "@/lib/stripe/sync-subscription"
  )

  await syncAuthorSubscriptionToDatabase(authorId, subscription)
}

export async function clearAuthorSubscription(authorId: string) {
  const admin = (await import("@/lib/supabase/admin")).createAdminClient()

  await admin
    .from("authors")
    .update({
      subscription_id: null,
      subscription_status: "inactive",
      subscription_end_date: null,
      subscription_cancel_at_period_end: false,
    })
    .eq("id", authorId)
}

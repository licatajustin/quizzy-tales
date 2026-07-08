"use server"

import { redirect } from "next/navigation"

import { deleteAuthorStorage } from "@/lib/account/delete-author-storage"
import {
  DELETE_ACCOUNT_CONFIRMATION_PHRASE,
  isDeleteAccountConfirmationValid,
} from "@/lib/account/constants"
import { refreshAuthorSubscriptionFromStripe } from "@/lib/billing"
import { getStripe } from "@/lib/stripe/client"
import { cancelSubscription } from "@/lib/stripe/subscription-quantity"
import {
  formatSubscriptionDate,
  requiresSubscriptionCancellationBeforeAccountDelete,
} from "@/lib/subscription"
import {
  getAuthorBillingProfile,
  getAuthorQuizCount,
  getPublishedQuizCount,
} from "@/lib/subscription-server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export type AccountActionResult = {
  error?: string
}

export type AccountDeletionInfo = {
  canDelete: boolean
  requiresSubscriptionCancellation: boolean
  quizCount: number
  publishedQuizCount: number
  isCancelingAtPeriodEnd: boolean
  subscriptionEndDate: string | null
}

export type AccountDeletionInfoResult =
  | ({ error: string } & Partial<AccountDeletionInfo>)
  | AccountDeletionInfo

async function requireAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return { supabase, user }
}

export async function getAccountDeletionInfo(): Promise<AccountDeletionInfoResult> {
  const { supabase, user } = await requireAuthenticatedUser()

  let author = await getAuthorBillingProfile(supabase, user.id)

  if (!author) {
    return { error: "Author profile not found." }
  }

  if (author.stripe_customer_id) {
    author = await refreshAuthorSubscriptionFromStripe(user.id, author)
  }

  const [quizCount, publishedQuizCount] = await Promise.all([
    getAuthorQuizCount(supabase, user.id),
    getPublishedQuizCount(supabase, user.id),
  ])

  const requiresSubscriptionCancellation =
    requiresSubscriptionCancellationBeforeAccountDelete(author)

  return {
    canDelete: !requiresSubscriptionCancellation,
    requiresSubscriptionCancellation,
    quizCount,
    publishedQuizCount,
    isCancelingAtPeriodEnd: author.subscription_cancel_at_period_end,
    subscriptionEndDate: formatSubscriptionDate(author.subscription_end_date),
  }
}

export async function deleteAccount(
  confirmation: string
): Promise<AccountActionResult> {
  const { supabase, user } = await requireAuthenticatedUser()

  if (!isDeleteAccountConfirmationValid(confirmation)) {
    return {
      error: `Type "${DELETE_ACCOUNT_CONFIRMATION_PHRASE}" exactly to confirm deletion.`,
    }
  }

  let author = await getAuthorBillingProfile(supabase, user.id)

  if (!author) {
    return { error: "Author profile not found." }
  }

  if (author.stripe_customer_id) {
    author = await refreshAuthorSubscriptionFromStripe(user.id, author)
  }

  if (requiresSubscriptionCancellationBeforeAccountDelete(author)) {
    return {
      error:
        "Cancel your subscription before deleting your account. Go to Billing to manage your subscription.",
    }
  }

  const stripe = getStripe()
  const admin = createAdminClient()

  if (author.subscription_id) {
    try {
      await cancelSubscription(author.subscription_id)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not cancel subscription."

      if (!message.toLowerCase().includes("canceled")) {
        return { error: message }
      }
    }
  }

  try {
    await deleteAuthorStorage(admin, user.id)
  } catch {
    // Storage cleanup failure should not block account deletion.
  }

  if (author.stripe_customer_id) {
    try {
      await stripe.customers.del(author.stripe_customer_id)
    } catch {
      // Customer may already be deleted in Stripe.
    }
  }

  const { error } = await admin.auth.admin.deleteUser(user.id)

  if (error) {
    return { error: error.message }
  }

  redirect("/?account-deleted=1")
}

"use server"

import { redirect } from "next/navigation"

import {
  DELETE_ACCOUNT_CONFIRMATION_PHRASE,
  isDeleteAccountConfirmationValid,
} from "@/lib/account/constants"
import { deleteAuthorStorage } from "@/lib/account/delete-author-storage"
import { refreshAuthorSubscriptionFromStripe } from "@/lib/billing"
import { getStripe } from "@/lib/stripe/client"
import { cancelSubscription } from "@/lib/stripe/subscription-quantity"
import {
  requiresSubscriptionCancellationBeforeAccountDelete,
} from "@/lib/subscription"
import {
  getAuthorBillingProfile,
} from "@/lib/subscription-server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export type AccountActionResult = {
  error?: string
}

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

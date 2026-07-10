import { CreditCard } from "lucide-react"

import { createCustomerPortalSession } from "@/app/actions/stripe"
import { BillingCheckoutReturn } from "@/components/checkout/checkout-return-handler"
import { PlanComparison } from "@/components/settings/plan-comparison"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  getCurrentPlanId,
  getPlanLabel,
  refreshAuthorSubscriptionFromStripe,
} from "@/lib/billing"
import { LIVE_QUIZ_PRICE_LABEL } from "@/lib/products"
import {
  formatSubscriptionDate,
  isPaidSubscriptionStatus,
  isSubscriptionCanceling,
} from "@/lib/subscription"
import {
  getAuthorBillingProfile,
  getSubscriptionAccessForUser,
} from "@/lib/subscription-server"
import { createClient } from "@/lib/supabase/server"

export default async function BillingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const billingProfile = await getAuthorBillingProfile(supabase, user.id)

  if (!billingProfile) {
    return null
  }

  const author = await refreshAuthorSubscriptionFromStripe(user.id, billingProfile)
  const access = await getSubscriptionAccessForUser(supabase, user.id)

  if (!author || !access) {
    return null
  }

  const isPaid = isPaidSubscriptionStatus(author.subscription_status)
  const isCanceling = isSubscriptionCanceling(author)
  const currentPlanId = await getCurrentPlanId(author)
  const currentPlanLabel = getPlanLabel(
    currentPlanId,
    author.subscription_quantity
  )
  const renewalDate = formatSubscriptionDate(author.subscription_end_date)

  async function openPortal() {
    "use server"
    const result = await createCustomerPortalSession()
    if (result.url) {
      const { redirect } = await import("next/navigation")
      redirect(result.url)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <BillingCheckoutReturn />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Billing</h1>
          <p className="mt-2 text-muted-foreground">
            {isPaid
              ? isCanceling
                ? "Your subscription is cancelled but live quizzes stay up until the end of your billing period."
                : "Manage your author plan, live quiz slots, and payment details."
              : `${LIVE_QUIZ_PRICE_LABEL}/month includes 1 live quiz slot and full builder access. Subscribe anytime.`}
          </p>
        </div>
        {isPaid ? (
          <form action={openPortal}>
            <Button type="submit" variant="outline" className="rounded-full">
              {isCanceling ? "Reactivate subscription" : "Manage subscription"}
            </Button>
          </form>
        ) : null}
      </div>

      <Card
        className={
          isPaid
            ? isCanceling
              ? "border-amber-500/30 bg-amber-500/5 ring-1 ring-amber-500/20"
              : "border-primary/30 bg-primary/5 ring-1 ring-primary/20"
            : "bg-card"
        }
      >
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-4" />
              {currentPlanLabel}
            </CardTitle>
            <CardDescription>
              {isPaid
                ? isCanceling && renewalDate
                  ? `Cancelled — live access continues until ${renewalDate}.`
                  : renewalDate
                    ? `Your subscription renews on ${renewalDate}.`
                    : "Your live quiz subscription is active."
                : access.hasActivePlan
                  ? `${access.publishedQuizCount} live · ${access.availableLiveSlots} slot${access.availableLiveSlots === 1 ? "" : "s"} available`
                  : "Unlimited drafts · subscribe to unlock builder credits"}
            </CardDescription>
          </div>
          <Badge
            variant={isCanceling ? "outline" : isPaid ? "default" : "secondary"}
            className="shrink-0"
          >
            {isCanceling ? "Cancelled" : isPaid ? "Active" : "Free"}
          </Badge>
        </CardHeader>
        {isPaid ? (
          <CardContent className="text-sm text-muted-foreground">
            Status:{" "}
            <span className="capitalize text-foreground">
              {isCanceling
                ? renewalDate
                  ? `Active until ${renewalDate} (cancelled)`
                  : "Cancelled (active until period end)"
                : author.subscription_status}
            </span>
          </CardContent>
        ) : null}
      </Card>

      <PlanComparison access={access} renewalDate={renewalDate} />
    </div>
  )
}

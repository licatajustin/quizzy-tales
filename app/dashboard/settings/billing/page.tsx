import { CreditCard } from "lucide-react"

import { createCustomerPortalSession } from "@/app/actions/stripe"
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
import { getCurrentPlanId, getPlanLabel, refreshAuthorSubscriptionFromStripe } from "@/lib/billing"
import { getBillingProducts } from "@/lib/products"
import { getStripePublishableKey } from "@/lib/stripe/env"
import {
  formatSubscriptionDate,
  getSubscriptionAccess,
  isPaidSubscriptionStatus,
  isSubscriptionCanceling,
} from "@/lib/subscription"
import {
  getAuthorBillingProfile,
  getAuthorQuizCount,
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
  const quizCount = await getAuthorQuizCount(supabase, user.id)

  if (!author) {
    return null
  }

  const access = getSubscriptionAccess(author, quizCount)
  const isPaid = isPaidSubscriptionStatus(author.subscription_status)
  const isCanceling = isSubscriptionCanceling(author)
  const currentPlanId = await getCurrentPlanId(author)
  const currentPlanLabel = getPlanLabel(currentPlanId)
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Billing</h1>
          <p className="mt-2 text-muted-foreground">
            {isPaid
              ? isCanceling
                ? "Your subscription is cancelled but Pro features stay available until the end of your billing period."
                : "Manage your Pro subscription or switch plans."
              : "Upgrade to publish quizzes, unlock AI tools, and create without limits."}
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
              You&apos;re on {currentPlanLabel}
            </CardTitle>
            <CardDescription>
              {isPaid
                ? isCanceling && renewalDate
                  ? `Cancelled — Pro access continues until ${renewalDate}.`
                  : renewalDate
                    ? `Your subscription renews on ${renewalDate}.`
                    : "Your Pro subscription is active."
                : `You have ${quizCount} of ${access.maxQuizzes} quiz${access.maxQuizzes === 1 ? "" : "zes"} on the free plan.`}
            </CardDescription>
          </div>
          <Badge
            variant={isCanceling ? "outline" : isPaid ? "default" : "secondary"}
            className="shrink-0"
          >
            {isCanceling ? "Cancelled" : isPaid ? "Pro" : "Free"}
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

      <PlanComparison
        products={getBillingProducts()}
        currentPlanId={currentPlanId}
        access={access}
        renewalDate={renewalDate}
        publishableKey={getStripePublishableKey()}
      />

    </div>
  )
}

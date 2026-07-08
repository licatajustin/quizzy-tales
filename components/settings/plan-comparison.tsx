"use client"

import { useState, useTransition } from "react"
import { Loader2 } from "lucide-react"

import { startSubscriptionCheckout } from "@/app/actions/stripe"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LIVE_QUIZ_PRICE_LABEL } from "@/lib/products"
import { redirectToStripeCheckout } from "@/lib/stripe/redirect-checkout"
import type { SubscriptionAccess } from "@/lib/subscription"

const BILLING_PERKS = [
  "1 live quiz slot included",
  "Full AI builder, revision & portraits",
  "Unlimited draft quizzes",
  "Engagement analytics on live quizzes",
  "Cancel anytime from billing",
]

type PlanComparisonProps = {
  access: SubscriptionAccess
  renewalDate: string | null
}

export function PlanComparison({
  access,
  renewalDate,
}: PlanComparisonProps) {
  const [isPending, startTransition] = useTransition()

  function handleStartPlan() {
    startTransition(() => {
      void redirectToStripeCheckout(() => startSubscriptionCheckout())
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Author plan</h2>
        <p className="text-sm text-muted-foreground">
          {access.hasActivePlan
            ? "Your plan includes AI access and live quiz slots. Add more slots when you publish additional quizzes."
            : "Subscribe to unlock AI while building. Includes 1 live quiz — publish when you're ready."}
        </p>
      </div>

      <Card className="bg-card">
        <CardHeader className="space-y-4">
          <div className="space-y-1">
            <CardTitle>
              {access.hasActivePlan ? "Your plan" : "Author plan"}
            </CardTitle>
            <CardDescription>
              {access.hasActivePlan && renewalDate
                ? `Renews ${renewalDate}`
                : `${LIVE_QUIZ_PRICE_LABEL}/month includes 1 live quiz slot`}
            </CardDescription>
          </div>
          <p className="text-3xl font-semibold tracking-tight">
            {LIVE_QUIZ_PRICE_LABEL}
            <span className="text-base font-normal text-muted-foreground">
              /month
            </span>
          </p>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <p>
              <span className="text-muted-foreground">Paid slots:</span>{" "}
              <span className="font-medium">{access.paidLiveSlots}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Live now:</span>{" "}
              <span className="font-medium">{access.publishedQuizCount}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Available:</span>{" "}
              <span className="font-medium">{access.availableLiveSlots}</span>
            </p>
            <p>
              <span className="text-muted-foreground">AI text left:</span>{" "}
              <span className="font-medium">{access.aiTextRemaining}</span>
            </p>
            <p>
              <span className="text-muted-foreground">AI portraits left:</span>{" "}
              <span className="font-medium">{access.aiImageRemaining}</span>
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {BILLING_PERKS.map((perk) => (
              <p
                key={perk}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                {perk}
              </p>
            ))}
          </div>

          {!access.hasActivePlan ? (
            <Button
              type="button"
              className="w-full rounded-full"
              disabled={isPending}
              onClick={handleStartPlan}
            >
              {isPending ? (
                <>
                  <Loader2 className="animate-spin" data-icon="inline-start" />
                  Redirecting to checkout...
                </>
              ) : (
                `Start plan · ${LIVE_QUIZ_PRICE_LABEL}/mo`
              )}
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">
              Extra live quizzes are {LIVE_QUIZ_PRICE_LABEL}/month each and
              prorate automatically when you publish beyond your included slot.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useTransition, type ReactNode } from "react"
import { Check, Sparkles } from "lucide-react"

import { startCheckoutSession } from "@/app/actions/stripe"
import { EmbeddedCheckoutForm } from "@/components/checkout/embedded-checkout-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { CurrentPlanId } from "@/lib/billing"
import { PRODUCT_IDS, type BillingProduct, type ProductId } from "@/lib/products"
import type { SubscriptionAccess } from "@/lib/subscription"
import { cn } from "@/lib/utils"

const FREE_PERKS = ["1 quiz", "Draft editing", "Preview mode"]

const PRO_PERKS = [
  "Unlimited quizzes",
  "Publish to public URLs",
  "AI generation and revision",
  "Engagement analytics",
]

type PlanComparisonProps = {
  products: BillingProduct[]
  currentPlanId: CurrentPlanId
  access: SubscriptionAccess
  renewalDate: string | null
  publishableKey: string
}

function PlanCard({
  isCurrent,
  currentBadgeLabel = "Current plan",
  badge,
  title,
  description,
  price,
  interval,
  perks,
  footer,
  highlighted,
  headerExtra,
}: {
  isCurrent: boolean
  currentBadgeLabel?: string
  badge?: string
  title: string
  description: string
  price: ReactNode
  interval?: string
  perks: string[]
  footer: ReactNode
  highlighted?: boolean
  headerExtra?: ReactNode
}) {
  return (
    <Card
      className={cn(
        "relative flex flex-col bg-card transition-colors",
        isCurrent &&
          "border-primary bg-primary/5 shadow-md ring-2 ring-primary/40",
        !isCurrent &&
          highlighted &&
          "border-primary/30 ring-1 ring-primary/15"
      )}
    >
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {isCurrent ? (
              <Badge className="rounded-full">{currentBadgeLabel}</Badge>
            ) : null}
            {badge ? (
              <Badge variant="secondary" className="rounded-full">
                {badge}
              </Badge>
            ) : null}
          </div>
        </div>
        {headerExtra}
        {typeof price === "string" ? (
          <p className="text-3xl font-semibold tracking-tight">
            {price}
            {interval ? (
              <span className="text-base font-normal text-muted-foreground">
                {interval}
              </span>
            ) : null}
          </p>
        ) : (
          price
        )}
      </CardHeader>
      <CardContent className="flex-1 space-y-2 text-sm">
        {perks.map((perk) => (
          <p
            key={perk}
            className={cn(
              "flex items-center gap-2",
              isCurrent ? "text-foreground" : "text-muted-foreground"
            )}
          >
            <Check
              className={cn(
                "size-4 shrink-0",
                isCurrent ? "text-primary" : "text-muted-foreground"
              )}
            />
            {perk}
          </p>
        ))}
      </CardContent>
      <CardFooter>{footer}</CardFooter>
    </Card>
  )
}

export function PlanComparison({
  products,
  currentPlanId,
  access,
  renewalDate,
  publishableKey,
}: PlanComparisonProps) {
  const monthly = products.find((product) => product.id === PRODUCT_IDS.monthly)
  const yearly = products.find((product) => product.id === PRODUCT_IDS.yearly)

  const defaultBillingTab =
    currentPlanId === PRODUCT_IDS.monthly
      ? PRODUCT_IDS.monthly
      : PRODUCT_IDS.yearly

  const [billingTab, setBillingTab] = useState<ProductId>(
    defaultBillingTab ?? PRODUCT_IDS.yearly
  )
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const selectedProduct =
    billingTab === PRODUCT_IDS.monthly ? monthly : yearly

  function handleCheckout(productId: BillingProduct["id"]) {
    setError(null)

    startTransition(async () => {
      const result = await startCheckoutSession(productId)

      if (result.error) {
        setError(result.error)
        setClientSecret(null)
        return
      }

      setClientSecret(result.clientSecret ?? null)
    })
  }

  if (clientSecret) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Complete checkout</h2>
            <p className="text-sm text-muted-foreground">
              Secure payment powered by Stripe.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => setClientSecret(null)}
          >
            Back to plans
          </Button>
        </div>
        <div className="overflow-hidden rounded-xl border border-border/60">
          <EmbeddedCheckoutForm
            clientSecret={clientSecret}
            publishableKey={publishableKey}
          />
        </div>
      </div>
    )
  }

  if (!monthly || !yearly || !selectedProduct) {
    return null
  }

  const isFreeCurrent = currentPlanId === "free"
  const isProCurrent = access.isPaid
  const isSelectedPlanCurrent = currentPlanId === selectedProduct.id

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Compare plans</h2>
        <p className="text-sm text-muted-foreground">
          Your current plan is highlighted below.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <PlanCard
          isCurrent={isFreeCurrent}
          title="Free"
          description="For exploring the editor"
          price="$0"
          interval="/forever"
          perks={FREE_PERKS}
          footer={
            <Button
              type="button"
              className="w-full rounded-full"
              variant={isFreeCurrent ? "secondary" : "outline"}
              disabled
            >
              {isFreeCurrent ? "Current plan" : "Included"}
            </Button>
          }
        />

        <PlanCard
          isCurrent={isProCurrent}
          currentBadgeLabel={
            access.cancelAtPeriodEnd ? "Cancelled" : "Current plan"
          }
          highlighted={!access.isPaid}
          title="Pro"
          description={
            isProCurrent && access.cancelAtPeriodEnd && renewalDate
              ? `Cancelled — access until ${renewalDate}`
              : isProCurrent && renewalDate
                ? `Renews ${renewalDate}`
                : "For authors ready to launch"
          }
          price={
            <p className="text-3xl font-semibold tracking-tight">
              {selectedProduct.priceLabel}
              <span className="text-base font-normal text-muted-foreground">
                {selectedProduct.intervalLabel}
              </span>
            </p>
          }
          headerExtra={
            <Tabs
              value={billingTab}
              onValueChange={(value) =>
                setBillingTab(value as typeof billingTab)
              }
            >
              <TabsList className="w-full">
                <TabsTrigger value={PRODUCT_IDS.monthly} className="flex-1">
                  Monthly
                </TabsTrigger>
                <TabsTrigger value={PRODUCT_IDS.yearly} className="flex-1 gap-2">
                  Annual
                  {yearly.savingsLabel ? (
                    <Badge
                      variant="secondary"
                      className="h-5 rounded-full px-1.5 text-[10px] font-medium"
                    >
                      {yearly.savingsLabel}
                    </Badge>
                  ) : null}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          }
          perks={PRO_PERKS}
          footer={
            <Button
              type="button"
              className="w-full rounded-full"
              variant={isProCurrent ? "secondary" : "default"}
              disabled={
                isSelectedPlanCurrent || isPending || access.cancelAtPeriodEnd
              }
              onClick={() => handleCheckout(selectedProduct.id)}
            >
              {access.cancelAtPeriodEnd
                ? renewalDate
                  ? `Access until ${renewalDate}`
                  : "Subscription cancelled"
                : isSelectedPlanCurrent
                  ? "Current plan"
                  : isProCurrent
                    ? "Switch billing"
                    : "Upgrade to Pro"}
              {!isSelectedPlanCurrent && !isProCurrent && !access.cancelAtPeriodEnd ? (
                <Sparkles data-icon="inline-end" />
              ) : null}
            </Button>
          }
        />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}

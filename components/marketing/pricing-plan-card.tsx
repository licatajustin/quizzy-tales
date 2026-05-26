import Link from "next/link"
import { Sparkles } from "lucide-react"

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
import { cn } from "@/lib/utils"

import type { PricingPlan } from "@/components/marketing/content"
import { SIGN_UP_PATH } from "@/components/marketing/content"

type PricingPlanCardProps = {
  plan: PricingPlan
}

function PricingPlanCard({ plan }: PricingPlanCardProps) {
  return (
    <Card
      className={cn(
        plan.highlighted
          ? "relative border-primary/30 bg-card shadow-md ring-1 ring-primary/15"
          : "border-border/70"
      )}
    >
      {plan.badge ? (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3">
          {plan.badge}
        </Badge>
      ) : null}
      <CardHeader>
        <CardTitle className="text-2xl font-normal">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
        <p className="pt-2 text-4xl">
          {plan.price}
          <span className="text-base font-sans text-muted-foreground">
            {plan.interval}
          </span>
        </p>
      </CardHeader>
      <CardContent
        className={cn(
          "space-y-3 text-sm",
          !plan.highlighted && "text-muted-foreground"
        )}
      >
        {plan.perks.map((perk) => (
          <p key={perk}>{perk}</p>
        ))}
      </CardContent>
      <CardFooter>
        <Button
          asChild
          variant={plan.highlighted ? "default" : "outline"}
          className="w-full rounded-full"
        >
          <Link href={SIGN_UP_PATH}>
            {plan.cta}
            {plan.highlighted ? <Sparkles className="ml-1 size-4" /> : null}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

export { PricingPlanCard }

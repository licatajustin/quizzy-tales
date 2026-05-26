import { MarketingSection } from "@/components/marketing/marketing-section"
import { PricingPlanCard } from "@/components/marketing/pricing-plan-card"
import { SectionHeader } from "@/components/marketing/section-header"
import { pricingPlans } from "@/components/marketing/content"

export function PricingSection() {
  return (
    <MarketingSection id="pricing" className="py-20 md:py-28">
      <SectionHeader
        eyebrow="Pricing"
        title="Start free. Go pro when you're ready to publish."
        description="Build your first quiz on the house. Unlock AI, publishing, and unlimited quizzes when you're ready to share with readers."
        align="center"
        className="mb-12"
      />

      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
        {pricingPlans.map((plan) => (
          <PricingPlanCard key={plan.name} plan={plan} />
        ))}
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Save with annual billing at $192/year — two months free.
      </p>
    </MarketingSection>
  )
}

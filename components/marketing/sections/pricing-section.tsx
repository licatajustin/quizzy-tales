import { MarketingSection } from "@/components/marketing/marketing-section"
import { PricingPlanCard } from "@/components/marketing/pricing-plan-card"
import { SectionHeader } from "@/components/marketing/section-header"
import { pricingPlans } from "@/components/marketing/content"

export function PricingSection() {
  return (
    <MarketingSection id="pricing" className="py-20 md:py-28">
      <SectionHeader
        eyebrow="Pricing"
        title="Start free. Subscribe when you're ready."
        description="Unlimited drafts and an AI trial. $15/month unlocks full AI and includes 1 live quiz — publish when your quiz is ready."
        align="center"
        className="mb-12"
      />

      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
        {pricingPlans.map((plan) => (
          <PricingPlanCard key={plan.name} plan={plan} />
        ))}
      </div>
    </MarketingSection>
  )
}

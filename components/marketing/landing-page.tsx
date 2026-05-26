import { PageBackground } from "@/components/marketing/page-background"
import { CtaSection } from "@/components/marketing/sections/cta-section"
import { FaqSection } from "@/components/marketing/sections/faq-section"
import { FeaturesSection } from "@/components/marketing/sections/features-section"
import { HeroSection } from "@/components/marketing/sections/hero-section"
import { HowItWorksSection } from "@/components/marketing/sections/how-it-works-section"
import { PricingSection } from "@/components/marketing/sections/pricing-section"
import { ProblemSection } from "@/components/marketing/sections/problem-section"
import { SocialProofSection } from "@/components/marketing/sections/social-proof-section"
import { SiteFooter } from "@/components/marketing/site-footer"

export function LandingPage() {
  return (
    <div className="relative min-h-svh overflow-x-hidden">
      <PageBackground />

      <main>
        <HeroSection />
        <SocialProofSection />
        <ProblemSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <FaqSection />
        <CtaSection />
      </main>

      <SiteFooter />
    </div>
  )
}

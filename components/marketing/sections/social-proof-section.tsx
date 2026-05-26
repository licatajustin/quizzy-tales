import { MarketingSection } from "@/components/marketing/marketing-section"
import { socialProofStats } from "@/components/marketing/content"

export function SocialProofSection() {
  return (
    <section className="border-y border-border/60 bg-card/40">
      <MarketingSection containerClassName="py-12">
        <div className="grid gap-8 sm:grid-cols-3">
          {socialProofStats.map((item) => (
            <div key={item.label} className="text-center sm:text-left">
              <p className="text-4xl text-foreground md:text-5xl">{item.stat}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      </MarketingSection>
    </section>
  )
}

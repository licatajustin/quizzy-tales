import { MarketingSection } from "@/components/marketing/marketing-section"
import { SectionHeader } from "@/components/marketing/section-header"
import { steps } from "@/components/marketing/content"

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="border-y border-border/60 bg-muted/30 py-20 md:py-28"
    >
      <MarketingSection>
        <SectionHeader
          eyebrow="How it works"
          title="From synopsis to shareable quiz in an afternoon"
          className="mb-14"
        />

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((item) => (
            <div key={item.step} className="space-y-4">
              <span className="text-5xl text-primary/30">{item.step}</span>
              <h3 className="text-2xl">{item.title}</h3>
              <p className="leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </MarketingSection>
    </section>
  )
}

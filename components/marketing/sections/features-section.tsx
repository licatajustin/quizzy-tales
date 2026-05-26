import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { MarketingSection } from "@/components/marketing/marketing-section"
import { SectionHeader } from "@/components/marketing/section-header"
import { features } from "@/components/marketing/content"

export function FeaturesSection() {
  return (
    <MarketingSection id="features" className="pb-20 md:pb-28">
      <SectionHeader
        eyebrow="Why QuizzyTales"
        title="A publishing tool with the polish your story deserves"
        className="mb-12"
      />

      <div className="grid gap-6 md:grid-cols-2">
        {features.map((feature) => (
          <Card
            key={feature.title}
            className="border-border/70 bg-card/70 shadow-sm backdrop-blur-sm"
          >
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <feature.icon className="size-5" />
              </div>
              <CardTitle className="text-xl font-normal">
                {feature.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base leading-relaxed">
                {feature.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </MarketingSection>
  )
}

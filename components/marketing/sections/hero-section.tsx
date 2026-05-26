import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MarketingSection } from "@/components/marketing/marketing-section"
import { QuizPreviewCard } from "@/components/marketing/quiz-preview-card"
import { SiteHeader } from "@/components/marketing/site-header"
import { SIGN_UP_PATH } from "@/components/marketing/content"

export function HeroSection() {
  return (
    <section className="relative">
      <div className="sticky top-0 z-50 px-4 pt-4 pb-2 md:px-6 md:pt-6 md:pb-4">
        <SiteHeader />
      </div>

      <MarketingSection className="pb-20 pt-16 md:pb-28 md:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="space-y-8">
            <Badge
              variant="secondary"
              className="rounded-full border border-border/60 bg-card/80 px-3 py-1 text-xs font-normal tracking-wide text-muted-foreground backdrop-blur-sm"
            >
              For authors & storytellers
            </Badge>

            <div className="space-y-5">
              <h1 className="text-5xl leading-[1.05] tracking-tight text-foreground md:text-6xl lg:text-7xl">
                The quiz your readers won&apos;t stop sharing
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                Create polished &ldquo;Which character are you?&rdquo; quizzes
                tied to your book — without learning quiz mechanics. Draft,
                publish, and watch readers become superfans.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg" className="rounded-full px-6">
                <Link href={SIGN_UP_PATH}>
                  Create your first quiz
                  <ArrowRight className="ml-1" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full px-6"
              >
                <Link href="#how-it-works">See how it works</Link>
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              Free to start · Pro from $20/mo · No credit card to explore
            </p>
          </div>

          <QuizPreviewCard />
        </div>
      </MarketingSection>
    </section>
  )
}

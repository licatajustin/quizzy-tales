import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MarketingSection } from "@/components/marketing/marketing-section"
import { SIGN_UP_PATH } from "@/components/marketing/content"

export function CtaSection() {
  return (
    <MarketingSection className="py-20 md:py-28">
      <Card className="overflow-hidden border-border/70 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <CardContent className="flex flex-col items-center gap-6 px-6 py-16 text-center md:px-12">
          <h2 className="max-w-2xl text-3xl tracking-tight md:text-4xl lg:text-5xl">
            Your next reader is one character result away from obsessed
          </h2>
          <p className="max-w-lg text-muted-foreground">
            Join authors who turn book launches into shareable moments — without
            building a quiz from scratch.
          </p>
          <Button asChild size="lg" className="rounded-full px-8">
            <Link href={SIGN_UP_PATH}>
              Create your first quiz
              <ArrowRight />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </MarketingSection>
  )
}

import { MarketingSection } from "@/components/marketing/marketing-section"

export function ProblemSection() {
  return (
    <MarketingSection className="py-20 md:py-28" containerClassName="max-w-3xl text-center">
      <h2 className="text-3xl tracking-tight md:text-4xl lg:text-5xl">
        You wrote a world people love. Now give them a reason to talk about it.
      </h2>
      <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
        Book links get clicks. Character quizzes get conversations — group
        chats, story threads, and &ldquo;I got the villain again&rdquo; posts
        that keep your title in circulation long after launch week.
      </p>
    </MarketingSection>
  )
}

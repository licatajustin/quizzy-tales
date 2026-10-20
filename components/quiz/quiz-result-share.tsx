import Image from "next/image"
import Link from "next/link"

import { QuizAuthorLogo } from "@/components/quiz/quiz-author-logo"
import { Button } from "@/components/ui/button"
import { normalizeTagline } from "@/lib/quiz/outcome-details"
import { normalizeQuizTheme } from "@/lib/quiz/theme"
import type { PublishedOutcome, PublishedQuizSnapshot } from "@/lib/quiz/types"

type QuizResultShareProps = {
  slug: string
  snapshot: PublishedQuizSnapshot
  outcome: PublishedOutcome
}

export function QuizResultShare({
  slug,
  snapshot,
  outcome,
}: QuizResultShareProps) {
  const tagline = normalizeTagline(outcome.tagline)
  const description = outcome.description.trim()
  const logoUrl = normalizeQuizTheme(snapshot.theme).logo_url

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col justify-center gap-8 px-6 py-12">
      <QuizAuthorLogo logoUrl={logoUrl} alt={`${snapshot.book_title} logo`} />
      {outcome.image_url ? (
        <div className="relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-2xl border border-border/60">
          <Image
            src={outcome.image_url}
            alt={`${outcome.name} from ${snapshot.book_title}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 80vw, 20rem"
            priority
            unoptimized={outcome.image_url.startsWith("data:")}
          />
        </div>
      ) : null}

      <div className="space-y-3 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          {snapshot.quiz_title}
          <span> · {snapshot.book_title}</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {outcome.name}
        </h1>
        {tagline ? (
          <p className="text-lg text-muted-foreground">{tagline}</p>
        ) : null}
        {description ? (
          <p className="text-muted-foreground">{description}</p>
        ) : null}
      </div>

      <Button asChild size="lg" className="mx-auto rounded-full px-8">
        <Link href={`/q/${slug}`}>Take the quiz</Link>
      </Button>
    </div>
  )
}

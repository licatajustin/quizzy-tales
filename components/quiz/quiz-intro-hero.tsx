import Image from "next/image"

import { QuizAuthorLogo } from "@/components/quiz/quiz-author-logo"
import { normalizeIntroText } from "@/lib/quiz/intro-text"
import { formatQuestionCount } from "@/lib/quiz/question-subset"
import { normalizeQuizTheme } from "@/lib/quiz/theme"
import type { PublishedQuizSnapshot } from "@/lib/quiz/types"

type QuizIntroHeroProps = {
  snapshot: PublishedQuizSnapshot
  questionCount: number
  outcomeCount: number
  isPreview?: boolean
}

export function QuizIntroHero({
  snapshot,
  questionCount,
  outcomeCount,
  isPreview = false,
}: QuizIntroHeroProps) {
  const intro = normalizeIntroText(snapshot.intro_text)
  const logoUrl = normalizeQuizTheme(snapshot.theme).logo_url

  return (
    <>
      {isPreview ? (
        <p className="text-center text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Author preview — draft content
        </p>
      ) : null}

      <QuizAuthorLogo logoUrl={logoUrl} alt={`${snapshot.book_title} logo`} />

      {snapshot.cover_image_url ? (
        <div className="relative mx-auto aspect-[4/3] w-full max-w-md overflow-hidden rounded-2xl border border-border/60">
          <Image
            src={snapshot.cover_image_url}
            alt={`Cover for ${snapshot.quiz_title}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 28rem"
            priority
            unoptimized={snapshot.cover_image_url.startsWith("data:")}
          />
        </div>
      ) : null}

      <div className="space-y-3 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          {snapshot.book_title}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {snapshot.quiz_title}
        </h1>
        {intro ? (
          <p className="text-base leading-relaxed text-muted-foreground">
            {intro}
          </p>
        ) : null}
        <p className="text-sm text-muted-foreground">
          {formatQuestionCount(questionCount)} · {outcomeCount} possible results
        </p>
      </div>
    </>
  )
}

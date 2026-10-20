import {
  CastCardGrid,
  OutcomeCastCard,
  outcomeCastFrameClass,
  visibleOutcomeLine,
} from "@/components/quiz/outcome-portrait"
import { normalizeTagline } from "@/lib/quiz/outcome-details"
import type { PublishedOutcome } from "@/lib/quiz/types"
import { cn } from "@/lib/utils"

type OutcomeGalleryProps = {
  outcomes: PublishedOutcome[]
  className?: string
}

export function OutcomeGallery({ outcomes, className }: OutcomeGalleryProps) {
  const cards = [...outcomes]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((outcome) => ({
      id: outcome.id,
      name: visibleOutcomeLine(outcome.name) || "Result",
      tagline: normalizeTagline(outcome.tagline),
      imageUrl: visibleOutcomeLine(outcome.image_url) || null,
    }))

  if (cards.length === 0) {
    return null
  }

  return (
    <div data-slot="outcome-gallery" className={className}>
      <div className="mx-auto mb-5 max-w-2xl text-center">
        <h3
          id="outcome-gallery-heading"
          className="text-base font-medium tracking-tight text-foreground"
        >
          The characters you might be
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          A portrait and a line for each result. Take the quiz to find your
          match.
        </p>
      </div>
      <CastCardGrid
        count={cards.length}
        aria-labelledby="outcome-gallery-heading"
      >
        {cards.map((card) => {
          const nameId = `outcome-gallery-${card.id}-name`
          const taglineId = `outcome-gallery-${card.id}-tagline`

          return (
            <li key={card.id} className="min-w-0">
              <article
                tabIndex={0}
                aria-labelledby={nameId}
                aria-describedby={card.tagline ? taglineId : undefined}
                className={cn(outcomeCastFrameClass, "h-full")}
              >
                <OutcomeCastCard
                  name={card.name}
                  tagline={card.tagline}
                  imageUrl={card.imageUrl}
                  nameId={nameId}
                  taglineId={card.tagline ? taglineId : undefined}
                  nameTag="h4"
                />
              </article>
            </li>
          )
        })}
      </CastCardGrid>
    </div>
  )
}

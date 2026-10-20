import { OutcomePortrait } from "@/components/quiz/outcome-portrait"
import {
  visibleOutcomeDetails,
  type OutcomeDetailSection,
} from "@/lib/quiz/outcome-details"
import type { PublishedOutcome } from "@/lib/quiz/types"
import { cn } from "@/lib/utils"

type OutcomeResultBodyProps = {
  outcome: PublishedOutcome
  quizTitle: string
  /** Small label above the character name. */
  eyebrow?: string
  headingLevel?: "h1" | "h2"
  /** Eager-load the portrait. Off when the portrait sits in a dialog. */
  prioritizeImage?: boolean
  /** Show a monogram when the outcome has no portrait. */
  portraitFallback?: boolean
  /** Slightly quieter type, for a dialog rather than the full result page. */
  compact?: boolean
}

function visibleCopy(value: string | null | undefined) {
  const text = value?.replace(/\u00a0/g, " ").trim() ?? ""
  return text.length > 0 ? text : ""
}

function OutcomeDetailCard({
  section,
  span,
  headingLevel,
}: {
  section: OutcomeDetailSection
  span: boolean
  headingLevel: "h2" | "h3"
}) {
  const label = visibleCopy(section.label)
  const Heading = headingLevel

  return (
    <article
      className={cn(
        "flex h-full flex-col gap-3 rounded-2xl border border-border/60 bg-card px-4 py-4 text-left text-card-foreground",
        span && "sm:col-span-2"
      )}
    >
      {label ? (
        <Heading className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          {label}
        </Heading>
      ) : null}
      {section.kind === "text" ? (
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
          {section.value}
        </p>
      ) : null}
      {section.kind === "bullets" ? (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {section.value.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="flex gap-2.5 text-sm leading-relaxed text-card-foreground"
            >
              <span
                aria-hidden
                className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {section.kind === "chips" ? (
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
          {section.value.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="rounded-full border border-border/70 bg-background px-3 py-1 text-sm text-foreground"
            >
              {item}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  )
}

export function OutcomeResultBody({
  outcome,
  quizTitle,
  eyebrow = "Your result",
  headingLevel = "h1",
  prioritizeImage = true,
  portraitFallback = false,
  compact = false,
}: OutcomeResultBodyProps) {
  const tagline = visibleCopy(outcome.tagline)
  const description = visibleCopy(outcome.description)
  const name = visibleCopy(outcome.name)
  const sections = visibleOutcomeDetails(outcome.details)
  const showPortrait = Boolean(outcome.image_url) || portraitFallback
  const Heading = headingLevel === "h2" ? "h2" : "h1"
  const sectionHeadingLevel = headingLevel === "h2" ? "h3" : "h2"

  return (
    <div
      className={cn(
        "flex flex-col items-center text-center",
        compact ? "gap-5" : "gap-6"
      )}
    >
      {showPortrait ? (
        <div
          className={cn(
            "relative isolate w-full",
            compact ? "max-w-xs" : "max-w-md"
          )}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-8 -z-10 rounded-full bg-primary/15 blur-3xl"
          />
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
            <OutcomePortrait
              name={name || "Result"}
              imageUrl={outcome.image_url}
              alt={outcome.image_url ? `${outcome.name} from ${quizTitle}` : ""}
              priority={prioritizeImage && Boolean(outcome.image_url)}
              sizes={
                compact
                  ? "(max-width: 768px) 80vw, 20rem"
                  : "(max-width: 768px) 100vw, 28rem"
              }
              initialsClassName={compact ? "text-5xl" : "text-6xl"}
            />
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        {eyebrow ? (
          <p className="text-xs font-medium tracking-[0.22em] text-muted-foreground uppercase">
            {eyebrow}
          </p>
        ) : null}
        {name ? (
          <Heading
            className={cn(
              "font-semibold tracking-tight text-balance text-foreground",
              compact
                ? "text-3xl leading-tight sm:text-4xl"
                : "text-4xl leading-[1.05] sm:text-5xl md:text-6xl"
            )}
          >
            {name}
          </Heading>
        ) : null}
        <div aria-hidden className="mx-auto h-1 w-12 rounded-full bg-primary" />
      </div>

      {tagline || description ? (
        <div className="quiz-callout w-full rounded-2xl border border-primary/25 bg-primary/10 px-5 py-4 text-foreground">
          {tagline ? (
            <p className="text-lg leading-snug font-medium text-balance text-foreground">
              {tagline}
            </p>
          ) : null}
          {description ? (
            <p
              className={cn(
                "text-sm leading-relaxed text-pretty whitespace-pre-wrap text-foreground/80",
                tagline && "mt-2"
              )}
            >
              {description}
            </p>
          ) : null}
        </div>
      ) : null}

      {sections.length > 0 ? (
        <div className="grid w-full grid-cols-1 gap-3 text-left sm:grid-cols-2">
          {sections.map((section, index) => (
            <OutcomeDetailCard
              key={`${section.kind}-${section.label}-${index}`}
              section={section}
              headingLevel={sectionHeadingLevel}
              span={
                sections.length === 1 ||
                (section.kind === "text" && section.value.length > 200)
              }
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

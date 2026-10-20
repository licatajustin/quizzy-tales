import Image from "next/image"

import {
  visibleOutcomeDetails,
  type OutcomeDetailSection,
} from "@/lib/quiz/outcome-details"
import type { PublishedOutcome } from "@/lib/quiz/types"
import { cn } from "@/lib/utils"

type OutcomeResultBodyProps = {
  outcome: PublishedOutcome
  quizTitle: string
}

function visibleCopy(value: string | null | undefined) {
  const text = value?.replace(/\u00a0/g, " ").trim() ?? ""
  return text.length > 0 ? text : ""
}

function OutcomeDetailCard({
  section,
  span,
}: {
  section: OutcomeDetailSection
  span: boolean
}) {
  const label = visibleCopy(section.label)

  return (
    <article
      className={cn(
        "flex h-full flex-col gap-3 rounded-2xl border border-border/60 bg-card px-4 py-4 text-left",
        span && "sm:col-span-2"
      )}
    >
      {label ? (
        <h2 className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          {label}
        </h2>
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
              className="flex gap-2.5 text-sm leading-relaxed"
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
              className="rounded-full border border-border/70 bg-background px-3 py-1 text-sm"
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
}: OutcomeResultBodyProps) {
  const tagline = visibleCopy(outcome.tagline)
  const description = visibleCopy(outcome.description)
  const name = visibleCopy(outcome.name)
  const sections = visibleOutcomeDetails(outcome.details)

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      {outcome.image_url ? (
        <div className="relative isolate w-full max-w-md">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-8 -z-10 rounded-full bg-primary/15 blur-3xl"
          />
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
            <Image
              src={outcome.image_url}
              alt={`${outcome.name} from ${quizTitle}`}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 28rem"
              unoptimized={outcome.image_url.startsWith("data:")}
            />
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        <p className="text-xs font-medium tracking-[0.22em] text-muted-foreground uppercase">
          Your result
        </p>
        {name ? (
          <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl">
            {name}
          </h1>
        ) : null}
        <div aria-hidden className="mx-auto h-1 w-12 rounded-full bg-primary" />
      </div>

      {tagline || description ? (
        <div className="w-full rounded-2xl border border-primary/25 bg-primary/10 px-5 py-4">
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

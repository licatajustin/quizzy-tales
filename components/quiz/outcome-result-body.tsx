import type { ReactNode } from "react"

import { visibleOutcomeDetails } from "@/lib/quiz/outcome-details"
import type { PublishedOutcome } from "@/lib/quiz/types"

type OutcomeResultBodyProps = {
  outcome: PublishedOutcome
  children?: ReactNode
}

export function OutcomeResultBody({
  outcome,
  children,
}: OutcomeResultBodyProps) {
  const tagline = outcome.tagline?.trim() ?? ""
  const description = outcome.description?.trim() ?? ""
  const sections = visibleOutcomeDetails(outcome.details)

  return (
    <>
      <div className="space-y-3 text-center">
        <p className="text-sm font-medium text-muted-foreground">You are...</p>
        <h2 className="text-3xl font-semibold tracking-tight">
          {outcome.name}
        </h2>
        {tagline ? (
          <p className="text-lg text-muted-foreground">{tagline}</p>
        ) : null}
        {description ? (
          <p className="text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {children}

      {sections.length > 0 ? (
        <div className="space-y-6 text-left">
          {sections.map((section, index) => (
            <section key={`${section.label}-${index}`} className="space-y-2">
              {section.label ? (
                <h3 className="text-sm font-medium">{section.label}</h3>
              ) : null}
              {section.kind === "text" ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {section.value}
                </p>
              ) : null}
              {section.kind === "bullets" ? (
                <ul className="m-0 list-disc space-y-1 pl-5 text-sm leading-relaxed">
                  {section.value.map((item, itemIndex) => (
                    <li key={`${item}-${itemIndex}`}>{item}</li>
                  ))}
                </ul>
              ) : null}
              {section.kind === "chips" ? (
                <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                  {section.value.map((item, itemIndex) => (
                    <li
                      key={`${item}-${itemIndex}`}
                      className="rounded-full border border-border/60 px-3 py-1 text-sm"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      ) : null}
    </>
  )
}

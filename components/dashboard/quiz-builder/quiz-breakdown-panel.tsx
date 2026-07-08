"use client"

import Image from "next/image"
import { Check, Circle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  getBuilderMissingFields,
  getBuilderProgress,
  isBuilderDraftValid,
  type QuizBuilderDraft,
} from "@/lib/quiz/builder/types"

type QuizBreakdownPanelProps = {
  draft: QuizBuilderDraft
}

export function QuizBreakdownPanel({ draft }: QuizBreakdownPanelProps) {
  const missing = getBuilderMissingFields(draft)
  const progress = getBuilderProgress(draft)
  const isValid = isBuilderDraftValid(draft)
  const progressPercent = (progress.complete / progress.total) * 100

  return (
    <Card className="flex h-full flex-col overflow-hidden bg-card">
      <CardHeader className="shrink-0 border-b border-border/60 pb-4">
        <CardTitle className="text-base">Quiz breakdown</CardTitle>
        <CardDescription>
          Live preview of what you&apos;re building
        </CardDescription>
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {progress.complete} of {progress.total} sections complete
            </span>
            {isValid ? (
              <Badge variant="default" className="rounded-full">
                Ready
              </Badge>
            ) : null}
          </div>
          <Progress value={progressPercent} />
        </div>
      </CardHeader>

      <ScrollArea className="min-h-0 flex-1">
        <CardContent className="space-y-6 p-4">
          <Section
            title="Quiz"
            done={Boolean(draft.quiz_title.trim())}
            empty="No quiz title yet"
          >
            {draft.quiz_title.trim() ? (
              <p className="font-medium">{draft.quiz_title}</p>
            ) : null}
          </Section>

          <Section
            title="Book"
            done={Boolean(draft.book_title.trim())}
            empty="No book title yet"
          >
            {draft.book_title.trim() ? (
              <p className="font-medium">{draft.book_title}</p>
            ) : null}
          </Section>

          <Section
            title="Cover image"
            done={Boolean(draft.cover_image_url)}
            optional
            empty="Optional — use Attach image below chat"
          >
            {draft.cover_image_url ? (
              <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-border/60">
                <Image
                  src={draft.cover_image_url}
                  alt="Quiz cover"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : null}
          </Section>

          <Section
            title={`Outcomes (${draft.outcomes.length})`}
            done={
              draft.outcomes.length >= 2 &&
              draft.outcomes.every(
                (outcome) => outcome.name.trim() && outcome.description.trim()
              )
            }
            empty="Characters will appear here"
          >
            {draft.outcomes.length === 0 ? null : (
              <div className="space-y-3">
                {draft.outcomes.map((outcome) => (
                  <div
                    key={outcome.id}
                    className="rounded-lg border border-border/60 p-3"
                  >
                    <div className="flex items-start gap-3">
                      {outcome.image_url ? (
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-md border border-border/60">
                          <Image
                            src={outcome.image_url}
                            alt={outcome.name || "Outcome"}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-md border border-dashed border-border/60 text-[10px] text-muted-foreground">
                          No photo
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">
                          {outcome.name.trim() || "Untitled outcome"}
                        </p>
                        {outcome.description.trim() ? (
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {outcome.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section
            title={`Questions (${draft.questions.length})`}
            done={draft.questions.length >= 3}
            empty="Questions will appear here"
          >
            {draft.questions.length === 0 ? null : (
              <div className="space-y-3">
                {draft.questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="rounded-lg border border-border/60 p-3"
                  >
                    <p className="text-sm font-medium">
                      {index + 1}.{" "}
                      {question.question_text.trim() || "Untitled question"}
                    </p>
                    <ul className="mt-2 space-y-1">
                      {question.answers.map((answer) => (
                        <li
                          key={answer.id}
                          className="rounded-md bg-muted/40 px-2 py-1 text-xs"
                        >
                          {answer.answer_text.trim() || "Answer"}
                          {draft.outcomes.length > 0 ? (
                            <span className="ml-2 text-muted-foreground">
                              (
                              {draft.outcomes
                                .map(
                                  (outcome) =>
                                    `${outcome.name.slice(0, 1)}:${answer.weights[outcome.id] ?? 0}`
                                )
                                .join(" ")}
                              )
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {!isValid ? (
            <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-3">
              <p className="text-xs font-medium">Still needed</p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {missing.map((field) => (
                  <li key={field}>• {field}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </ScrollArea>
    </Card>
  )
}

function Section({
  title,
  done,
  optional,
  empty,
  children,
}: {
  title: string
  done: boolean
  optional?: boolean
  empty: string
  children?: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {done ? (
          <Check className="size-3.5 text-primary" />
        ) : (
          <Circle className="size-3.5 text-muted-foreground" />
        )}
        <p className="text-sm font-medium">{title}</p>
        {optional ? (
          <Badge variant="secondary" className="rounded-full text-[10px]">
            Optional
          </Badge>
        ) : null}
      </div>
      {children ?? <p className="text-xs text-muted-foreground">{empty}</p>}
    </div>
  )
}

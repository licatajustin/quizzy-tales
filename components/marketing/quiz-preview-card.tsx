import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

import { quizPreviewAnswers } from "./content"

const SELECTED_ANSWER_INDEX = 1

export function QuizPreviewCard() {
  return (
    <Card className="relative overflow-hidden border-border/70 bg-card/90 shadow-xl backdrop-blur-sm">
      <div
        aria-hidden
        className="absolute -right-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl"
      />
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className="rounded-full font-normal">
            The Hollow Crown
          </Badge>
          <span className="text-xs text-muted-foreground">7 questions</span>
        </div>
        <CardTitle className="text-2xl font-normal leading-snug">
          Which character are you?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        <p className="text-sm font-medium">
          A stranger offers you a deal you can&apos;t verify. You…
        </p>
        <div className="space-y-2">
          {quizPreviewAnswers.map((answer, index) => (
            <div
              key={answer}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-sm transition-colors",
                index === SELECTED_ANSWER_INDEX
                  ? "border-primary/40 bg-primary/5 text-foreground"
                  : "border-border/70 bg-background/60 text-muted-foreground"
              )}
            >
              {answer}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 pt-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-2/7 rounded-full bg-primary" />
          </div>
          <span className="text-xs text-muted-foreground">2 of 7</span>
        </div>
      </CardContent>
      <CardFooter className="border-t border-border/60 bg-muted/20 py-4">
        <p className="text-xs text-muted-foreground">
          Live preview · Readers get a shareable character result
        </p>
      </CardFooter>
    </Card>
  )
}

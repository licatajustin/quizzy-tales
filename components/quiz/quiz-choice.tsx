import { cn } from "@/lib/utils"

export function quizChoiceClass(
  selected: boolean,
  themed: boolean,
  locked = false
) {
  return cn(
    "quiz-choice rounded-xl border px-4 py-4 text-left text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
    locked && "cursor-not-allowed",
    themed
      ? selected
        ? "border-[var(--quiz-option-selected-border)] bg-[var(--quiz-option-selected)] text-[var(--quiz-option-selected-text)]"
        : cn(
            "border-[var(--quiz-border)] bg-[var(--quiz-option)] text-[var(--quiz-option-text)]",
            locked
              ? "disabled:text-[var(--quiz-option-text)] disabled:opacity-100"
              : "hover:bg-[var(--quiz-option-hover)] hover:text-[var(--quiz-option-hover-text)]"
          )
      : selected
        ? "border-primary bg-primary/10 text-foreground"
        : cn(
            "border-border/60 bg-card/40 text-foreground",
            locked
              ? "disabled:text-foreground disabled:opacity-100"
              : "hover:bg-accent/40"
          )
  )
}

import { cn } from "@/lib/utils"

export function quizChoiceClass(selected: boolean, themed: boolean) {
  return cn(
    "rounded-xl border px-4 py-4 text-left text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
    themed
      ? selected
        ? "border-[var(--quiz-option-selected-border)] bg-[var(--quiz-option-selected)] text-[var(--quiz-option-selected-text)]"
        : "border-[var(--quiz-border)] bg-[var(--quiz-option)] text-[var(--quiz-option-text)] hover:bg-[var(--quiz-option-hover)] hover:text-[var(--quiz-option-hover-text)]"
      : selected
        ? "border-primary bg-primary/10 text-foreground"
        : "border-border/60 bg-card/40 text-foreground hover:bg-accent/40"
  )
}

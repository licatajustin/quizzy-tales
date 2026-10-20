import { OutcomeGallery } from "@/components/quiz/outcome-gallery"
import {
  formatQuestionCount,
  resolveQuestionsPerAttempt,
} from "@/lib/quiz/question-subset"
import type { PublishedQuizSnapshot } from "@/lib/quiz/types"

type QuizSeoContentProps = {
  snapshot: PublishedQuizSnapshot
}

export function QuizSeoContent({ snapshot }: QuizSeoContentProps) {
  const outcomes = [...snapshot.outcomes].sort(
    (a, b) => a.sort_order - b.sort_order
  )
  const questions = [...snapshot.questions].sort(
    (a, b) => a.sort_order - b.sort_order
  )
  const shownCount = resolveQuestionsPerAttempt(
    snapshot.random_question_subset,
    snapshot.questions_per_attempt,
    questions.length
  )
  const sampleQuestion = questions[0]?.question_text

  return (
    <section
      aria-label="About this quiz"
      className="mx-auto max-w-3xl border-t border-border/60 px-6 py-12 text-sm text-muted-foreground"
    >
      <div className="mx-auto max-w-2xl">
        <h2 className="text-base font-medium text-foreground">
          About {snapshot.quiz_title}
        </h2>
        <p className="mt-3 leading-relaxed">
          Take this personality quiz inspired by{" "}
          <strong>{snapshot.book_title}</strong>. Answer{" "}
          {formatQuestionCount(shownCount)} to discover which character you are
          most like — then share your result with friends and book clubs.
        </p>

        {sampleQuestion ? (
          <p className="mt-3 leading-relaxed">
            Example question: &ldquo;{sampleQuestion}&rdquo;
          </p>
        ) : null}
      </div>

      <OutcomeGallery outcomes={outcomes} className="mt-10" />
    </section>
  )
}

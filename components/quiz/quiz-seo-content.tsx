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
  const sampleQuestion = questions[0]?.question_text

  return (
    <section
      aria-label="About this quiz"
      className="mx-auto max-w-2xl border-t border-border/60 px-6 py-10 text-sm text-muted-foreground"
    >
      <h2 className="text-base font-medium text-foreground">
        About {snapshot.quiz_title}
      </h2>
      <p className="mt-3 leading-relaxed">
        Take this personality quiz inspired by <strong>{snapshot.book_title}</strong>
        . Answer {questions.length} questions to discover which character you are
        most like — then share your result with friends and book clubs.
      </p>

      {sampleQuestion ? (
        <p className="mt-3 leading-relaxed">
          Example question: &ldquo;{sampleQuestion}&rdquo;
        </p>
      ) : null}

      {outcomes.length > 0 ? (
        <div className="mt-6">
          <h3 className="font-medium text-foreground">Possible character results</h3>
          <ul className="mt-3 space-y-3">
            {outcomes.map((outcome) => (
              <li key={outcome.id}>
                <span className="font-medium text-foreground">{outcome.name}</span>
                {outcome.description ? (
                  <span> — {outcome.description}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}

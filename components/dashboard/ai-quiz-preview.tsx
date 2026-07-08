import type { GeneratedQuiz } from "@/lib/ai/schemas"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type AiQuizPreviewProps = {
  quiz: GeneratedQuiz
}

export function AiQuizPreview({ quiz }: AiQuizPreviewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">{quiz.quiz_title}</h3>
        <p className="text-sm text-muted-foreground">
          {quiz.outcomes.length} outcomes · {quiz.questions.length} questions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Character outcomes</CardTitle>
          <CardDescription>
            These become your quiz results after you save.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {quiz.outcomes.map((outcome) => (
            <div
              key={outcome.id}
              className="rounded-lg border border-border/60 p-4"
            >
              <div className="flex items-center gap-2">
                <p className="font-medium">{outcome.name}</p>
                <Badge variant="secondary">{outcome.id}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {outcome.description}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {quiz.questions.map((question, index) => (
            <div
              key={`${question.question_text}-${index}`}
              className="rounded-lg border border-border/60 p-4"
            >
              <p className="font-medium">
                {index + 1}. {question.question_text}
              </p>
              <ul className="mt-3 space-y-2">
                {question.answers.map((answer) => (
                  <li
                    key={answer.answer_text}
                    className="rounded-md bg-muted/40 px-3 py-2 text-sm"
                  >
                    {answer.answer_text}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

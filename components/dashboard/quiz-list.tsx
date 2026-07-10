import Link from "next/link"

import { QuizListActions } from "@/components/dashboard/quiz-list-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { QuizListItem } from "@/lib/quiz/types"

type QuizListProps = {
  quizzes: QuizListItem[]
}

export function QuizList({ quizzes }: QuizListProps) {
  if (quizzes.length === 0) {
    return (
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>No quizzes yet</CardTitle>
          <CardDescription>
            Create your first personality quiz for your readers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="rounded-full">
            <Link href="/dashboard/quizzes/new">Create a quiz</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {quizzes.map((quiz) => (
        <Card key={quiz.id} className="min-w-0 bg-card">
          <CardHeader className="pb-3">
            <CardTitle
              className="min-w-0 truncate text-base"
              title={quiz.quiz_title}
            >
              {quiz.quiz_title}
            </CardTitle>
            <CardDescription
              className="min-w-0 truncate"
              title={quiz.book_title}
            >
              {quiz.book_title}
            </CardDescription>
            <CardAction>
              <QuizListActions quizId={quiz.id} title={quiz.quiz_title} />
            </CardAction>
          </CardHeader>
          <CardContent className="mt-auto flex items-center justify-between gap-3">
            <Badge variant={quiz.status === "published" ? "default" : "secondary"}>
              {quiz.status}
            </Badge>
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href={`/dashboard/quizzes/${quiz.id}`}>Open editor</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

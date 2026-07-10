"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { deleteQuiz } from "@/app/actions/quizzes"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { QuizRow } from "@/lib/quiz/types"

type QuizListProps = {
  quizzes: QuizRow[]
}

export function QuizList({ quizzes }: QuizListProps) {
  const router = useRouter()

  async function handleDelete(quizId: string, title: string) {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) {
      return
    }

    const result = await deleteQuiz(quizId)
    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success("Quiz deleted")
    router.refresh()
  }

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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Quiz actions"
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/quizzes/${quiz.id}`}>
                      <Pencil data-icon="inline-start" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => handleDelete(quiz.id, quiz.quiz_title)}
                  >
                    <Trash2 data-icon="inline-start" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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

import Link from "next/link"
import { BookOpen, PenLine } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type QuizCreationPathSelectorProps = {
  canUseAI: boolean
}

export function QuizCreationPathSelector({
  canUseAI,
}: QuizCreationPathSelectorProps) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">New quiz</h1>
        <p className="mt-2 text-muted-foreground">
          Choose how you want to create your personality quiz.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col bg-card">
          <CardHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-muted">
              <PenLine className="size-5 text-foreground" />
            </div>
            <CardTitle>Build it yourself</CardTitle>
            <CardDescription>
              Start with a blank quiz and add outcomes, questions, and scoring
              in the editor at your own pace.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Full control over every question and outcome</li>
              <li>Best if you already know your quiz structure</li>
              <li>No builder credits required</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full rounded-full">
              <Link href="/dashboard/quizzes/new/manual">Create manually</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card
          className={`flex flex-col bg-card ${canUseAI ? "" : "opacity-80"}`}
        >
          <CardHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-primary/10">
              <BookOpen className="size-5 text-primary" />
            </div>
            <CardTitle className="flex items-center gap-2">
              Start from your book
            </CardTitle>
            <CardDescription>
              Share your book details and we&apos;ll research it, draft a
              full quiz, and let you review before saving.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>We research your book from its knowledge and your synopsis</li>
              <li>We draft outcomes, questions, and weighted scoring</li>
              <li>Review and approve before it becomes a draft</li>
            </ul>
          </CardContent>
          <CardFooter>
            {canUseAI ? (
              <Button asChild className="w-full rounded-full">
                <Link href="/dashboard/quizzes/new/guided">
                  Start guided creation
                </Link>
              </Button>
            ) : (
              <Button disabled className="w-full rounded-full">
                Included credits used — upgrade to unlock
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

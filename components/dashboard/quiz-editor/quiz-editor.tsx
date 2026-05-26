"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ExternalLink, Eye, Rocket, Undo2 } from "lucide-react"
import { toast } from "sonner"

import { publishQuiz, unpublishQuiz } from "@/app/actions/quizzes"
import { DetailsTab } from "@/components/dashboard/quiz-editor/details-tab"
import { OutcomesTab } from "@/components/dashboard/quiz-editor/outcomes-tab"
import { QuestionsTab } from "@/components/dashboard/quiz-editor/questions-tab"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { validateQuizForPublish } from "@/lib/quiz/published-snapshot"
import type { QuizDraft } from "@/lib/quiz/types"

type QuizEditorProps = {
  draft: QuizDraft
}

export function QuizEditor({ draft }: QuizEditorProps) {
  const router = useRouter()
  const validationErrors = validateQuizForPublish(draft)
  const canPublish = validationErrors.length === 0

  async function handlePublish() {
    const result = await publishQuiz(draft.quiz.id)
    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success("Quiz published")
    router.refresh()
  }

  async function handleUnpublish() {
    const result = await unpublishQuiz(draft.quiz.id)
    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success("Quiz unpublished")
    router.refresh()
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {draft.quiz.quiz_title}
            </h1>
            <Badge variant={draft.quiz.status === "published" ? "default" : "secondary"}>
              {draft.quiz.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{draft.quiz.book_title}</p>
          {!canPublish ? (
            <p className="text-xs text-muted-foreground">
              Before publishing: {validationErrors.join(" ")}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="rounded-full">
            <Link href={`/dashboard/quizzes/${draft.quiz.id}/preview`}>
              <Eye data-icon="inline-start" />
              Preview
            </Link>
          </Button>

          {draft.quiz.status === "published" ? (
            <>
              <Button asChild variant="outline" className="rounded-full">
                <Link href={`/q/${draft.quiz.slug}`} target="_blank">
                  <ExternalLink data-icon="inline-start" />
                  Live quiz
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={handleUnpublish}
              >
                <Undo2 data-icon="inline-start" />
                Unpublish
              </Button>
            </>
          ) : (
            <Button
              type="button"
              className="rounded-full"
              disabled={!canPublish}
              onClick={handlePublish}
            >
              <Rocket data-icon="inline-start" />
              Publish
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="outcomes">
            Outcomes ({draft.outcomes.length})
          </TabsTrigger>
          <TabsTrigger value="questions">
            Questions ({draft.questions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <DetailsTab quiz={draft.quiz} />
        </TabsContent>
        <TabsContent value="outcomes" className="mt-6">
          <OutcomesTab quizId={draft.quiz.id} outcomes={draft.outcomes} />
        </TabsContent>
        <TabsContent value="questions" className="mt-6">
          <QuestionsTab
            quizId={draft.quiz.id}
            questions={draft.questions}
            answers={draft.answers}
            outcomes={draft.outcomes}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

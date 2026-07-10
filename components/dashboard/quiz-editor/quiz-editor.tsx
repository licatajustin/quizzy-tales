"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Suspense, useTransition } from "react"
import { ExternalLink, Eye, Rocket, Undo2 } from "lucide-react"
import { toast } from "sonner"

import { publishQuiz, unpublishQuiz } from "@/app/actions/quizzes"
import {
  startPublishCheckout,
  startSubscriptionCheckout,
} from "@/app/actions/stripe"
import { CheckoutReturnHandler } from "@/components/checkout/checkout-return-handler"
import { showAiLimitToast } from "@/lib/ai/show-ai-limit-toast"
import { DetailsTab } from "@/components/dashboard/quiz-editor/details-tab"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LIVE_QUIZ_PRICE_LABEL } from "@/lib/products"
import { validateQuizForPublish } from "@/lib/quiz/published-snapshot"
import type { QuizDraft } from "@/lib/quiz/types"
import type { SubscriptionAccess } from "@/lib/subscription"
import { redirectToStripeCheckout } from "@/lib/stripe/redirect-checkout"

function TabSkeleton() {
  return <Skeleton className="h-96 w-full rounded-xl" />
}

const OutcomesTab = dynamic(
  () =>
    import("@/components/dashboard/quiz-editor/outcomes-tab").then(
      (module) => module.OutcomesTab
    ),
  { loading: () => <TabSkeleton /> }
)

const QuestionsTab = dynamic(
  () =>
    import("@/components/dashboard/quiz-editor/questions-tab").then(
      (module) => module.QuestionsTab
    ),
  { loading: () => <TabSkeleton /> }
)

const AiAssistTab = dynamic(
  () =>
    import("@/components/dashboard/quiz-editor/ai-assist-tab").then(
      (module) => module.AiAssistTab
    ),
  { loading: () => <TabSkeleton /> }
)

type QuizEditorProps = {
  draft: QuizDraft
  access: SubscriptionAccess
  hasLiveChanges: boolean
}

export function QuizEditor({
  draft,
  access,
  hasLiveChanges,
}: QuizEditorProps) {
  const router = useRouter()
  const [isCheckoutPending, startCheckout] = useTransition()
  const validationErrors = validateQuizForPublish(draft)
  const canPublishQuiz = validationErrors.length === 0
  const quizPath = `/dashboard/quizzes/${draft.quiz.id}`

  function handleAiUpgrade() {
    if (!access.isPaid) {
      startCheckout(() => {
        void redirectToStripeCheckout(() =>
          startSubscriptionCheckout(quizPath)
        )
      })
      return
    }

    showAiLimitToast({
      description:
        "You've used this month's builder credits. Add another live quiz slot in Billing for more.",
    })
  }

  async function handlePublish() {
    const result = await publishQuiz(draft.quiz.id)

    if (result.requiresBilling) {
      startCheckout(() => {
        void redirectToStripeCheckout(() => startPublishCheckout(draft.quiz.id))
      })
      return
    }

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success(
      draft.quiz.status === "published"
        ? "Live quiz updated"
        : "Quiz is now live"
    )
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
      <Suspense fallback={null}>
        <CheckoutReturnHandler successMessage="Payment complete. Your quiz should be live shortly." />
      </Suspense>

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
          {access.isInGracePeriod && access.graceEndsAt ? (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Billing grace period ends{" "}
              {new Date(access.graceEndsAt).toLocaleDateString()}. Update payment
              to keep quizzes live.
            </p>
          ) : null}
          {draft.quiz.status === "draft" && !canPublishQuiz ? (
            <p className="text-xs text-muted-foreground">
              Before publishing: {validationErrors.join(" ")}
            </p>
          ) : draft.quiz.status === "draft" ? (
            <p className="text-xs text-muted-foreground">
              Going live uses one slot on your author plan.
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
              {hasLiveChanges ? (
                <Button
                  type="button"
                  className="rounded-full"
                  disabled={!canPublishQuiz || isCheckoutPending}
                  onClick={handlePublish}
                >
                  <Rocket data-icon="inline-start" />
                  Update live quiz
                </Button>
              ) : null}
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
              disabled={!canPublishQuiz || isCheckoutPending}
              onClick={handlePublish}
            >
              <Rocket data-icon="inline-start" />
              Go live · {LIVE_QUIZ_PRICE_LABEL}/mo
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
          <TabsTrigger value="ai">Revise</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <DetailsTab quiz={draft.quiz} />
        </TabsContent>
        <TabsContent value="outcomes" className="mt-6">
          <OutcomesTab
            quizId={draft.quiz.id}
            outcomes={draft.outcomes}
            canUseAI={access.canUseAI}
            onUpgrade={handleAiUpgrade}
          />
        </TabsContent>
        <TabsContent value="questions" className="mt-6">
          <QuestionsTab
            quizId={draft.quiz.id}
            questions={draft.questions}
            answers={draft.answers}
            outcomes={draft.outcomes}
          />
        </TabsContent>
        <TabsContent value="ai" className="mt-6">
          <AiAssistTab
            quizId={draft.quiz.id}
            canUseAI={access.canUseAI}
            onUpgrade={handleAiUpgrade}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

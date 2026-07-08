"use client"

import { useState, useTransition } from "react"
import { Loader2, Sparkles } from "lucide-react"

import { persistQuizBuilderDraft } from "@/app/actions/ai"
import {
  startPublishCheckout,
  startSubscriptionCheckout,
} from "@/app/actions/stripe"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { LIVE_QUIZ_PRICE_LABEL } from "@/lib/products"
import { getBuilderMissingFields } from "@/lib/quiz/builder/types"
import type { QuizBuilderDraft } from "@/lib/quiz/builder/types"
import { clearBuilderSession } from "@/lib/quiz/builder/session-storage"
import { redirectToStripeCheckout } from "@/lib/stripe/redirect-checkout"

type AiUpgradeDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  draft: QuizBuilderDraft
  isDraftValid: boolean
  progressSaved: boolean
}

export function AiUpgradeDialog({
  open,
  onOpenChange,
  draft,
  isDraftValid,
  progressSaved,
}: AiUpgradeDialogProps) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startAction] = useTransition()

  const missingFields = getBuilderMissingFields(draft)

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen)

    if (!nextOpen) {
      setError(null)
    }
  }

  function handleStartPlan() {
    setError(null)

    startAction(async () => {
      const started = await redirectToStripeCheckout(() =>
        startSubscriptionCheckout("/dashboard/quizzes/new")
      )

      if (!started) {
        setError("Could not open checkout.")
      }
    })
  }

  function handleSaveAndGoLive() {
    setError(null)

    startAction(async () => {
      const saveResult = await persistQuizBuilderDraft(draft)

      if (saveResult.error || !saveResult.quizId) {
        setError(saveResult.error ?? "Could not save your quiz.")
        return
      }

      clearBuilderSession()

      const started = await redirectToStripeCheckout(() =>
        startPublishCheckout(saveResult.quizId!)
      )

      if (!started) {
        setError("Could not open checkout.")
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            Unlock more AI
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-left text-sm text-muted-foreground">
              <p>
                {progressSaved
                  ? "Your builder progress is saved in this browser."
                  : "Subscribe to unlock full AI while building."}
              </p>
              <p>
                The author plan is {LIVE_QUIZ_PRICE_LABEL}/month and includes 1
                live quiz slot plus full AI access. Checkout opens on Stripe&apos;s
                secure page.
              </p>
              {!isDraftValid && missingFields.length > 0 ? (
                <p>Still needed: {missingFields.join(", ")}</p>
              ) : null}
              {error ? <p className="text-destructive">{error}</p> : null}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            type="button"
            className="w-full rounded-full"
            disabled={isPending}
            onClick={handleStartPlan}
          >
            {isPending ? (
              <>
                <Loader2 className="animate-spin" data-icon="inline-start" />
                Opening checkout...
              </>
            ) : (
              `Start plan · ${LIVE_QUIZ_PRICE_LABEL}/mo`
            )}
          </Button>

          {isDraftValid ? (
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-full"
              disabled={isPending}
              onClick={handleSaveAndGoLive}
            >
              Save quiz & go live now
            </Button>
          ) : null}

          <AlertDialogCancel disabled={isPending}>Not now</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2, PenLine, X } from "lucide-react"
import { toast } from "sonner"

import { applyAiRevisionPatch } from "@/app/actions/ai"
import { AiQuizPreview } from "@/components/dashboard/ai-quiz-preview"
import { UpgradePrompt } from "@/components/subscription/upgrade-prompt"
import { showAiLimitToast } from "@/lib/ai/show-ai-limit-toast"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import type { GeneratedQuiz, QuizRevisionPatch } from "@/lib/ai/schemas"

const QUICK_COMMANDS = [
  "Make the tone darker and more dramatic.",
  "Add 2 more questions with balanced scoring.",
  "Rebalance scoring so every character is equally reachable.",
  "Shorten outcome descriptions for mobile readers.",
  "Make questions more scenario-based.",
]

type AiAssistTabProps = {
  quizId: string
  canUseAI: boolean
  onUpgrade?: () => void
}

export function AiAssistTab({ quizId, canUseAI, onUpgrade }: AiAssistTabProps) {
  const router = useRouter()
  const [instruction, setInstruction] = useState("")
  const [patch, setPatch] = useState<QuizRevisionPatch | null>(null)
  const [previewQuiz, setPreviewQuiz] = useState<GeneratedQuiz | null>(null)
  const [isGenerating, startGenerate] = useTransition()
  const [isApplying, startApply] = useTransition()

  if (!canUseAI) {
    return (
      <UpgradePrompt
        title="Revision requires a plan"
        description="Start the author plan to unlock quiz revision and more monthly credits."
      />
    )
  }

  function handleGenerate(nextInstruction = instruction) {
    const trimmed = nextInstruction.trim()

    if (trimmed.length < 3) {
      toast.error("Enter a revision instruction.")
      return
    }

    startGenerate(async () => {
      const response = await fetch("/api/revise-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quiz_id: quizId,
          instruction: trimmed,
        }),
      })

      const payload = (await response.json()) as {
        patch?: QuizRevisionPatch
        error?: string
      }

      if (!response.ok || !payload.patch) {
        if (
          payload.error === "SUBSCRIPTION_REQUIRED" ||
          payload.error === "AI_LIMIT_REACHED" ||
          payload.error === "TRIAL_REVISE_BLOCKED"
        ) {
          showAiLimitToast({
            description:
              "Start the author plan to unlock revision and more monthly credits.",
            onUpgrade,
          })
          return
        }

        toast.error(payload.error ?? "Could not revise quiz.")
        return
      }

      setPatch(payload.patch)

      if (
        payload.patch.outcomes.length > 0 &&
        payload.patch.questions.length > 0
      ) {
        setPreviewQuiz({
          quiz_title: payload.patch.quiz_title,
          outcomes: payload.patch.outcomes,
          questions: payload.patch.questions,
        })
      } else {
        setPreviewQuiz(null)
      }

      toast.success("Revision ready for review")
    })
  }

  function handleApply() {
    if (!patch) {
      return
    }

    startApply(async () => {
      const result = await applyAiRevisionPatch(quizId, patch)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success("Changes applied")
      setPatch(null)
      setPreviewQuiz(null)
      setInstruction("")
      router.refresh()
    })
  }

  function handleReject() {
    setPatch(null)
    setPreviewQuiz(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Revise</h2>
        <p className="text-sm text-muted-foreground">
          Describe how you want the quiz to change. Review the patch before
          applying it to your draft.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PenLine className="size-4 text-primary" />
            Revision instruction
          </CardTitle>
          <CardDescription>
            Try a quick command or write your own direction.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {QUICK_COMMANDS.map((command) => (
              <Button
                key={command}
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => {
                  setInstruction(command)
                  handleGenerate(command)
                }}
              >
                {command}
              </Button>
            ))}
          </div>

          <Textarea
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            rows={4}
            placeholder="Make the quiz feel more whimsical and add a question about how the reader handles conflict..."
          />

          <Button
            type="button"
            className="rounded-full"
            disabled={isGenerating}
            onClick={() => handleGenerate()}
          >
            {isGenerating ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : (
              <PenLine data-icon="inline-start" />
            )}
            {isGenerating ? "Revising..." : "Generate revision"}
          </Button>
        </CardContent>
      </Card>

      {patch ? (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-base">Suggested changes</CardTitle>
            <CardDescription>{patch.summary}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {previewQuiz ? <AiQuizPreview quiz={previewQuiz} /> : null}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                className="rounded-full"
                disabled={isApplying}
                onClick={handleApply}
              >
                <Check data-icon="inline-start" />
                {isApplying ? "Applying..." : "Apply changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={handleReject}
              >
                <X data-icon="inline-start" />
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

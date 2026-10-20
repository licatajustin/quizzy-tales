"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus, Sparkles, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  createOutcome,
  deleteOutcome,
  updateOutcome,
} from "@/app/actions/quizzes"
import { OutcomePortraitControls } from "@/components/dashboard/quiz-editor/outcome-portrait-controls"
import { OutcomeProfileEditor } from "@/components/dashboard/quiz-editor/outcome-profile-editor"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { showAiLimitToast } from "@/lib/ai/show-ai-limit-toast"
import type { OutcomeDetailSection } from "@/lib/quiz/outcome-details"
import type { OutcomeRow } from "@/lib/quiz/types"

type OutcomesTabProps = {
  quizId: string
  outcomes: OutcomeRow[]
  canUseAI: boolean
  onUpgrade?: () => void
}

export function OutcomesTab({
  quizId,
  outcomes,
  canUseAI,
  onUpgrade,
}: OutcomesTabProps) {
  const router = useRouter()
  const [pendingTarget, setPendingTarget] = useState<string | null>(null)
  const [isGenerating, startGenerate] = useTransition()

  async function handleCreate() {
    const result = await createOutcome(quizId, { name: "New character" })
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Outcome added")
    router.refresh()
  }

  async function handleUpdate(outcome: OutcomeRow) {
    const result = await updateOutcome(outcome.id, {
      name: outcome.name,
      description: outcome.description,
      image_url: outcome.image_url,
      tagline: outcome.tagline,
      details: outcome.details,
    })
    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success("Outcome saved")
  }

  async function handleDelete(outcomeId: string, name: string) {
    if (!window.confirm(`Delete outcome "${name}"?`)) {
      return
    }

    const result = await deleteOutcome(outcomeId)
    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success("Outcome deleted")
    router.refresh()
  }

  function handleGenerateDetails(outcomeId?: string) {
    if (!canUseAI) {
      showAiLimitToast({
        description: "Start the author plan to fill in result profiles.",
        onUpgrade,
      })
      return
    }

    if (outcomes.length === 0) {
      toast.error("Add an outcome first.")
      return
    }

    const target = outcomeId ?? "all"
    setPendingTarget(target)
    startGenerate(async () => {
      try {
        const response = await fetch("/api/generate-outcome-details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quiz_id: quizId,
            outcome_id: outcomeId,
          }),
        })

        const payload = (await response.json()) as { error?: string }

        if (!response.ok) {
          if (
            payload.error === "SUBSCRIPTION_REQUIRED" ||
            payload.error === "AI_LIMIT_REACHED" ||
            payload.error === "TRIAL_REVISE_BLOCKED"
          ) {
            showAiLimitToast({
              description: "Start the author plan to fill in result profiles.",
              onUpgrade,
            })
            return
          }

          toast.error(payload.error ?? "Could not write result profiles.")
          return
        }

        toast.success(
          outcomeId ? "Result profile ready" : "Result profiles ready"
        )
        await router.refresh()
      } finally {
        setPendingTarget(null)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Character outcomes</h2>
          <p className="text-sm text-muted-foreground">
            Add at least two outcomes before publishing.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={isGenerating || outcomes.length === 0}
            onClick={() => handleGenerateDetails()}
          >
            {pendingTarget === "all" ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : (
              <Sparkles data-icon="inline-start" />
            )}
            Generate details for all
          </Button>
          <Button type="button" className="rounded-full" onClick={handleCreate}>
            <Plus data-icon="inline-start" />
            Add outcome
          </Button>
        </div>
      </div>

      {outcomes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No outcomes yet. Add your first character result.
        </p>
      ) : null}

      <div className="space-y-4">
        {outcomes.map((outcome) => (
          <OutcomeCard
            key={`${outcome.id}:${outcome.tagline}:${outcome.description}:${JSON.stringify(outcome.details)}`}
            quizId={quizId}
            outcome={outcome}
            canUseAI={canUseAI}
            isGenerating={
              isGenerating &&
              (pendingTarget === "all" || pendingTarget === outcome.id)
            }
            generateDisabled={isGenerating}
            onUpgrade={onUpgrade}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onGenerateDetails={() => handleGenerateDetails(outcome.id)}
          />
        ))}
      </div>
    </div>
  )
}

function OutcomeCard({
  quizId,
  outcome,
  canUseAI,
  isGenerating,
  generateDisabled,
  onUpgrade,
  onUpdate,
  onDelete,
  onGenerateDetails,
}: {
  quizId: string
  outcome: OutcomeRow
  canUseAI: boolean
  isGenerating: boolean
  generateDisabled: boolean
  onUpgrade?: () => void
  onUpdate: (outcome: OutcomeRow) => Promise<void>
  onDelete: (outcomeId: string, name: string) => Promise<void>
  onGenerateDetails: () => void
}) {
  const [localOutcome, setLocalOutcome] = useState(outcome)

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <p className="text-sm font-medium">Outcome</p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={generateDisabled}
            onClick={onGenerateDetails}
          >
            {isGenerating ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : (
              <Sparkles data-icon="inline-start" />
            )}
            Generate details
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Delete outcome"
            onClick={() => onDelete(localOutcome.id, localOutcome.name)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <FieldGroup>
        <Field>
          <FieldLabel>Name</FieldLabel>
          <FieldDescription>
            The character name shown in results — e.g. &ldquo;Elena the
            Brave&rdquo;.
          </FieldDescription>
          <Input
            defaultValue={localOutcome.name}
            onBlur={(event) => {
              const name = event.target.value
              if (name === localOutcome.name) return
              const next = { ...localOutcome, name }
              setLocalOutcome(next)
              onUpdate(next)
            }}
          />
        </Field>
        <Field>
          <FieldLabel>Description</FieldLabel>
          <FieldDescription>
            The short summary readers see first on the result screen.
          </FieldDescription>
          <Textarea
            defaultValue={localOutcome.description}
            rows={3}
            onBlur={(event) => {
              const description = event.target.value
              if (description === localOutcome.description) return
              const next = { ...localOutcome, description }
              setLocalOutcome(next)
              onUpdate(next)
            }}
          />
        </Field>
        <OutcomeProfileEditor
          tagline={localOutcome.tagline}
          details={localOutcome.details}
          onTaglineCommit={(tagline) => {
            const next = { ...localOutcome, tagline }
            setLocalOutcome(next)
            onUpdate(next)
          }}
          onDetailsChange={(details: OutcomeDetailSection[]) => {
            const next = { ...localOutcome, details }
            setLocalOutcome(next)
            onUpdate(next)
          }}
        />
      </FieldGroup>

      <div className="mt-4">
        <OutcomePortraitControls
          quizId={quizId}
          outcomeId={localOutcome.id}
          imageUrl={localOutcome.image_url}
          canUseAI={canUseAI}
          onUpgrade={onUpgrade}
          onImageChange={(imageUrl) => {
            const next = { ...localOutcome, image_url: imageUrl }
            setLocalOutcome(next)
            onUpdate(next)
          }}
        />
      </div>
    </div>
  )
}

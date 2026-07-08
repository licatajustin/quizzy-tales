"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  createOutcome,
  deleteOutcome,
  updateOutcome,
} from "@/app/actions/quizzes"
import { OutcomePortraitControls } from "@/components/dashboard/quiz-editor/outcome-portrait-controls"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Character outcomes</h2>
          <p className="text-sm text-muted-foreground">
            Add at least two outcomes before publishing.
          </p>
        </div>
        <Button type="button" className="rounded-full" onClick={handleCreate}>
          <Plus data-icon="inline-start" />
          Add outcome
        </Button>
      </div>

      {outcomes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No outcomes yet. Add your first character result.
        </p>
      ) : null}

      <div className="space-y-4">
        {outcomes.map((outcome) => (
          <OutcomeCard
            key={outcome.id}
            quizId={quizId}
            outcome={outcome}
            canUseAI={canUseAI}
            onUpgrade={onUpgrade}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
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
  onUpgrade,
  onUpdate,
  onDelete,
}: {
  quizId: string
  outcome: OutcomeRow
  canUseAI: boolean
  onUpgrade?: () => void
  onUpdate: (outcome: OutcomeRow) => Promise<void>
  onDelete: (outcomeId: string, name: string) => Promise<void>
}) {
  const [localOutcome, setLocalOutcome] = useState(outcome)

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <p className="text-sm font-medium">Outcome</p>
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
            Shown on the result screen when a reader gets this character.
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

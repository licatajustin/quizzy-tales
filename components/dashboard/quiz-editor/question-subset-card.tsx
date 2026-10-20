"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { updateQuizQuestionSettings } from "@/app/actions/quizzes"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  subsetExceedsPool,
  validateQuestionsPerAttemptInput,
} from "@/lib/quiz/question-subset"

type QuestionSubsetCardProps = {
  quizId: string
  questionCount: number
  randomQuestionSubset: boolean
  questionsPerAttempt: number | null
}

export function QuestionSubsetCard({
  quizId,
  questionCount,
  randomQuestionSubset,
  questionsPerAttempt,
}: QuestionSubsetCardProps) {
  const [enabled, setEnabled] = useState(randomQuestionSubset)
  const [countInput, setCountInput] = useState(
    questionsPerAttempt == null ? "" : String(questionsPerAttempt)
  )
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle"
  )
  const [savedCount, setSavedCount] = useState(questionsPerAttempt)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestIdRef = useRef(0)
  const isFirstRun = useRef(true)
  const lastSavedRef = useRef(
    `${randomQuestionSubset}:${questionsPerAttempt ?? ""}`
  )

  const parsedCount = /^\d+$/.test(countInput.trim())
    ? Number(countInput.trim())
    : null
  const countToSave = enabled
    ? parsedCount
    : parsedCount != null && parsedCount >= 1
      ? parsedCount
      : savedCount
  const exceedsPool = subsetExceedsPool(enabled, parsedCount, questionCount)
  const validationError = validateQuestionsPerAttemptInput(
    countToSave,
    questionCount,
    enabled,
    savedCount
  )

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }

    if (validationError) {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      return
    }

    const signature = `${enabled}:${countToSave ?? ""}`
    if (signature === lastSavedRef.current) {
      return
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(async () => {
      const requestId = ++requestIdRef.current
      setSaveState("saving")
      const result = await updateQuizQuestionSettings(quizId, {
        random_question_subset: enabled,
        questions_per_attempt: countToSave,
      })

      if (requestId !== requestIdRef.current) {
        return
      }

      if (result.error) {
        toast.error(result.error)
        setSaveState("idle")
        return
      }

      setSavedCount(countToSave)
      lastSavedRef.current = signature
      setSaveState("saved")
    }, 500)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [countToSave, enabled, questionCount, quizId, savedCount, validationError])

  function handleEnabledChange(checked: boolean) {
    if (checked && questionCount < 1) {
      return
    }

    setEnabled(checked)

    if (checked && countInput.trim() === "" && questionCount > 0) {
      setCountInput(String(questionCount))
    }

    if (!checked && (parsedCount == null || parsedCount < 1)) {
      setCountInput(savedCount == null ? "" : String(savedCount))
    }
  }

  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle>Random question subset</CardTitle>
          <CardDescription>
            Each reader can answer a random set of questions instead of the full
            quiz. Leave this off to show every question, which is how existing
            quizzes work.
          </CardDescription>
        </div>
        <p className="shrink-0 text-xs text-muted-foreground">
          {saveState === "saving"
            ? "Saving..."
            : saveState === "saved"
              ? "Saved"
              : ""}
        </p>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor="random-question-subset">
                Give each reader a random subset
              </FieldLabel>
              <FieldDescription>
                Shuffle the pool and show N questions per attempt. Scoring only
                counts the questions they see. A refresh keeps that same set;
                retaking picks a new one.
              </FieldDescription>
            </FieldContent>
            <Switch
              id="random-question-subset"
              checked={enabled}
              disabled={questionCount < 1 && !enabled}
              onCheckedChange={handleEnabledChange}
            />
          </Field>
          <Field data-invalid={validationError ? true : undefined}>
            <FieldLabel htmlFor="questions-per-attempt">
              Questions per attempt
            </FieldLabel>
            <Input
              id="questions-per-attempt"
              type="number"
              inputMode="numeric"
              min={1}
              max={questionCount > 0 ? questionCount : undefined}
              step={1}
              className="max-w-32"
              value={countInput}
              disabled={!enabled || questionCount < 1}
              aria-invalid={validationError ? true : undefined}
              aria-describedby="questions-per-attempt-help"
              onChange={(event) => setCountInput(event.target.value)}
            />
            <FieldDescription id="questions-per-attempt-help">
              {questionCount > 0
                ? `Enter a whole number from 1 to ${questionCount}.`
                : "Add a question before choosing how many to show."}
            </FieldDescription>
            {validationError ? (
              <p className="text-sm text-destructive">{validationError}</p>
            ) : exceedsPool ? (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                This quiz has {questionCount} questions, so readers will see all
                of them until you lower this number or add questions.
              </p>
            ) : null}
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  )
}

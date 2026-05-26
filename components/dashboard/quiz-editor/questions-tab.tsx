"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Info, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  createAnswer,
  createQuestion,
  deleteAnswer,
  deleteQuestion,
  updateAnswer,
  updateQuestion,
} from "@/app/actions/quizzes"
import { ScoreChips } from "@/components/dashboard/quiz-editor/score-chips"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { AnswerRow, OutcomeRow, QuestionRow } from "@/lib/quiz/types"

type QuestionsTabProps = {
  quizId: string
  questions: QuestionRow[]
  answers: AnswerRow[]
  outcomes: OutcomeRow[]
}

export function QuestionsTab({
  quizId,
  questions,
  answers,
  outcomes,
}: QuestionsTabProps) {
  const router = useRouter()

  async function handleCreateQuestion() {
    const result = await createQuestion(quizId)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Question added")
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Questions & scoring</h2>
          <p className="text-sm text-muted-foreground">
            Each answer adds points to characters. Highest total wins.
          </p>
        </div>
        <Button type="button" className="rounded-full" onClick={handleCreateQuestion}>
          <Plus data-icon="inline-start" />
          Add question
        </Button>
      </div>

      <Alert>
        <Info />
        <AlertTitle>How scoring works</AlertTitle>
        <AlertDescription>
          For every answer, choose how many points (0–10) each character
          receives if a reader picks it. Use 0 when the answer has nothing to
          do with a character, and 10 when it&apos;s a perfect fit. Points add
          up across all questions — the character with the most wins.
        </AlertDescription>
      </Alert>

      {questions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No questions yet. Add at least three before publishing.
        </p>
      ) : null}

      <div className="space-y-6">
        {questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            index={index}
            question={question}
            answers={answers.filter((answer) => answer.question_id === question.id)}
            outcomes={outcomes}
            onRefresh={() => router.refresh()}
          />
        ))}
      </div>
    </div>
  )
}

function QuestionCard({
  index,
  question,
  answers,
  outcomes,
  onRefresh,
}: {
  index: number
  question: QuestionRow
  answers: AnswerRow[]
  outcomes: OutcomeRow[]
  onRefresh: () => void
}) {
  async function handleDeleteQuestion() {
    if (!window.confirm("Delete this question and its answers?")) {
      return
    }

    const result = await deleteQuestion(question.id)
    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success("Question deleted")
    onRefresh()
  }

  async function handleUpdateQuestion(fields: Partial<QuestionRow>) {
    const result = await updateQuestion(question.id, {
      question_text: fields.question_text ?? question.question_text,
      allow_multiple: fields.allow_multiple ?? question.allow_multiple,
    })

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success("Question saved")
  }

  async function handleCreateAnswer() {
    const result = await createAnswer(question.id)
    if (result.error) {
      toast.error(result.error)
      return
    }
    onRefresh()
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <p className="text-sm font-medium">Question {index + 1}</p>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Delete question"
          onClick={handleDeleteQuestion}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <FieldGroup>
        <Field>
          <FieldLabel>Question text</FieldLabel>
          <FieldDescription>
            The prompt readers answer. Keep it short and fun.
          </FieldDescription>
          <Textarea
            defaultValue={question.question_text}
            rows={2}
            onBlur={(event) => {
              const questionText = event.target.value
              if (questionText === question.question_text) return
              handleUpdateQuestion({ question_text: questionText })
            }}
          />
        </Field>
        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel>Allow multiple answers</FieldLabel>
            <FieldDescription>
              Let readers pick more than one option before continuing.
            </FieldDescription>
          </FieldContent>
          <Switch
            checked={question.allow_multiple}
            onCheckedChange={(checked) =>
              handleUpdateQuestion({ allow_multiple: checked })
            }
          />
        </Field>
      </FieldGroup>

      <div className="mt-6 space-y-4">
        {answers.map((answer) => (
          <AnswerCard
            key={answer.id}
            answer={answer}
            outcomes={outcomes}
            onRefresh={onRefresh}
          />
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-4 rounded-full"
        onClick={handleCreateAnswer}
      >
        <Plus data-icon="inline-start" />
        Add answer
      </Button>
    </div>
  )
}

function AnswerCard({
  answer,
  outcomes,
  onRefresh,
}: {
  answer: AnswerRow
  outcomes: OutcomeRow[]
  onRefresh: () => void
}) {
  const [weights, setWeights] = useState(answer.weights)
  const weightsRef = useRef(answer.weights)
  const requestIdRef = useRef(0)

  useEffect(() => {
    setWeights(answer.weights)
    weightsRef.current = answer.weights
  }, [answer.id, answer.weights])

  async function handleDeleteAnswer() {
    const result = await deleteAnswer(answer.id)
    if (result.error) {
      toast.error(result.error)
      return
    }
    onRefresh()
  }

  async function handleTextBlur(text: string) {
    if (text === answer.answer_text) return

    const result = await updateAnswer(answer.id, { answer_text: text })
    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success("Answer saved")
  }

  async function handleWeightChange(outcomeId: string, value: number) {
    const previous = weightsRef.current
    const next = { ...previous, [outcomeId]: value }

    setWeights(next)
    weightsRef.current = next

    const requestId = ++requestIdRef.current
    const result = await updateAnswer(answer.id, {
      answer_text: answer.answer_text,
      weights: next,
    })

    if (requestId !== requestIdRef.current) {
      return
    }

    if (result.error) {
      setWeights(previous)
      weightsRef.current = previous
      toast.error(result.error)
      return
    }

    toast.success("Scoring saved")
  }

  return (
    <div className="rounded-lg border border-border/50 bg-card p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <Field className="flex-1">
          <FieldLabel>Answer</FieldLabel>
          <FieldDescription>
            One choice readers can pick for this question.
          </FieldDescription>
          <Input
            defaultValue={answer.answer_text}
            onBlur={(event) => handleTextBlur(event.target.value)}
          />
        </Field>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Delete answer"
          onClick={handleDeleteAnswer}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
          {outcomes.map((outcome) => (
            <ScoreChips
              key={outcome.id}
              outcomeId={outcome.id}
              outcomeName={outcome.name}
              value={weights[outcome.id] ?? 0}
              onChange={handleWeightChange}
            />
          ))}
      </div>
    </div>
  )
}

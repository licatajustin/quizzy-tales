"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { calculateWinningOutcome } from "@/lib/quiz/scoring"
import type { PublishedQuizSnapshot } from "@/lib/quiz/types"
import { cn } from "@/lib/utils"

type QuizPlayerProps = {
  snapshot: PublishedQuizSnapshot
  isPreview?: boolean
}

type PlayerState = "intro" | "playing" | "result"

export function QuizPlayer({ snapshot, isPreview = false }: QuizPlayerProps) {
  const [state, setState] = useState<PlayerState>("intro")
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selectedByQuestion, setSelectedByQuestion] = useState<
    Record<string, string[]>
  >({})

  const questions = useMemo(
    () => [...snapshot.questions].sort((a, b) => a.sort_order - b.sort_order),
    [snapshot.questions]
  )

  const outcomes = useMemo(
    () => [...snapshot.outcomes].sort((a, b) => a.sort_order - b.sort_order),
    [snapshot.outcomes]
  )

  const currentQuestion = questions[questionIndex]
  const selectedForCurrent = currentQuestion
    ? (selectedByQuestion[currentQuestion.id] ?? [])
    : []

  const allAnswers = useMemo(
    () => questions.flatMap((question) => question.answers),
    [questions]
  )

  const allSelectedAnswerIds = useMemo(
    () => Object.values(selectedByQuestion).flat(),
    [selectedByQuestion]
  )

  const winningOutcome = useMemo(() => {
    const winner = calculateWinningOutcome(
      outcomes.map((outcome) => ({
        id: outcome.id,
        quiz_id: "",
        name: outcome.name,
        description: outcome.description,
        image_url: outcome.image_url,
        sort_order: outcome.sort_order,
      })),
      allSelectedAnswerIds,
      allAnswers
    )
    return winner
      ? outcomes.find((outcome) => outcome.id === winner.id) ?? outcomes[0]
      : outcomes[0]
  }, [allSelectedAnswerIds, allAnswers, outcomes])

  function resetQuiz() {
    setState("intro")
    setQuestionIndex(0)
    setSelectedByQuestion({})
  }

  function toggleAnswer(answerId: string) {
    if (!currentQuestion) return

    setSelectedByQuestion((previous) => {
      const current = previous[currentQuestion.id] ?? []

      if (currentQuestion.allow_multiple) {
        const next = current.includes(answerId)
          ? current.filter((id) => id !== answerId)
          : [...current, answerId]
        return { ...previous, [currentQuestion.id]: next }
      }

      return { ...previous, [currentQuestion.id]: [answerId] }
    })

    if (!currentQuestion.allow_multiple) {
      if (questionIndex >= questions.length - 1) {
        setState("result")
      } else {
        setQuestionIndex((index) => index + 1)
      }
    }
  }

  function submitMultiple() {
    if (questionIndex >= questions.length - 1) {
      setState("result")
    } else {
      setQuestionIndex((index) => index + 1)
    }
  }

  if (state === "intro") {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col justify-center gap-8 px-6 py-12">
        {isPreview ? (
          <p className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Author preview — draft content
          </p>
        ) : null}

        {snapshot.cover_image_url ? (
          <div className="relative mx-auto aspect-[4/3] w-full max-w-md overflow-hidden rounded-2xl border border-border/60">
            <Image
              src={snapshot.cover_image_url}
              alt=""
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ) : null}

        <div className="space-y-3 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            {snapshot.book_title}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {snapshot.quiz_title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {questions.length} questions · {outcomes.length} possible results
          </p>
        </div>

        <Button
          type="button"
          size="lg"
          className="mx-auto rounded-full px-8"
          onClick={() => setState("playing")}
        >
          Start the quiz
        </Button>
      </div>
    )
  }

  if (state === "result" && winningOutcome) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col justify-center gap-8 px-6 py-12">
        <div className="space-y-3 text-center">
          <p className="text-sm font-medium text-muted-foreground">You are...</p>
          <h2 className="text-3xl font-semibold tracking-tight">
            {winningOutcome.name}
          </h2>
          <p className="text-muted-foreground">{winningOutcome.description}</p>
        </div>

        {winningOutcome.image_url ? (
          <div className="relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-2xl border border-border/60">
            <Image
              src={winningOutcome.image_url}
              alt=""
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ) : null}

        <div className="flex flex-wrap justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={resetQuiz}
          >
            <RotateCcw data-icon="inline-start" />
            Retake quiz
          </Button>
        </div>
      </div>
    )
  }

  if (!currentQuestion) {
    return null
  }

  const progress = ((questionIndex + 1) / questions.length) * 100

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col gap-8 px-6 py-12">
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Question {questionIndex + 1} of {questions.length}
          </span>
          <span>{snapshot.book_title}</span>
        </div>
        <Progress value={progress} />
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">
          {currentQuestion.question_text}
        </h2>

        <div className="grid gap-3">
          {[...currentQuestion.answers]
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((answer) => {
              const selected = selectedForCurrent.includes(answer.id)
              return (
                <button
                  key={answer.id}
                  type="button"
                  onClick={() => toggleAnswer(answer.id)}
                  className={cn(
                    "rounded-xl border px-4 py-4 text-left text-sm transition-colors",
                    selected
                      ? "border-primary bg-primary/10"
                      : "border-border/60 bg-card/40 hover:bg-accent/40"
                  )}
                >
                  {answer.answer_text}
                </button>
              )
            })}
        </div>

        {currentQuestion.allow_multiple ? (
          <Button
            type="button"
            className="rounded-full"
            disabled={selectedForCurrent.length === 0}
            onClick={submitMultiple}
          >
            Continue
          </Button>
        ) : null}
      </div>
    </div>
  )
}

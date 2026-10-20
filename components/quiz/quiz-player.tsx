"use client"

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import Image from "next/image"
import { RotateCcw } from "lucide-react"

import { OutcomeResultBody } from "@/components/quiz/outcome-result-body"
import { QuizResultLinks } from "@/components/quiz/quiz-result-links"
import { QuizShareButton } from "@/components/quiz/quiz-share-button"

import {
  getAnonymousId,
  getTrackingContext,
  trackEvent,
} from "@/lib/analytics/client"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  attemptRestoreBootstrapScript,
  attemptStorageKey,
  formatQuestionCount,
  getAttemptStorageServerSnapshot,
  isAttemptStoragePending,
  notifyAttemptStorage,
  parseStoredQuizAttempt,
  pickRandomQuestions,
  quizProgressPercent,
  readAttemptStorageSnapshot,
  resolvePersistedQuestions,
  resolveQuestionsPerAttempt,
  selectionForShownQuestions,
  subscribeAttemptStorage,
  writeStoredQuizAttempt,
} from "@/lib/quiz/question-subset"
import { normalizePublishedSnapshot } from "@/lib/quiz/published-snapshot"
import { snapshotReaderLinks } from "@/lib/quiz/reader-links"
import { calculateWinningOutcome } from "@/lib/quiz/scoring"
import type { PublishedQuizSnapshot } from "@/lib/quiz/types"
import { cn } from "@/lib/utils"

type QuizPlayerProps = {
  quizId?: string
  snapshot: PublishedQuizSnapshot
  isPreview?: boolean
  children?: React.ReactNode
}

type PlayerState = "intro" | "playing" | "result"

const EMPTY_SELECTION: Record<string, string[]> = {}
const SINGLE_CHOICE_ADVANCE_MS = 500

function answeredQuestionCount(
  questions: readonly { id: string }[],
  selectedByQuestion: Record<string, string[]>
) {
  return questions.filter(
    (question) => (selectedByQuestion[question.id] ?? []).length > 0
  ).length
}

type SubsetSession = {
  state: PlayerState
  questionIndex: number
  selectedByQuestion: Record<string, string[]>
  chosenQuestions: PublishedQuizSnapshot["questions"] | null
}

export function QuizPlayer({
  quizId,
  snapshot: rawSnapshot,
  isPreview = false,
  children,
}: QuizPlayerProps) {
  const snapshot = useMemo(
    () => normalizePublishedSnapshot(rawSnapshot),
    [rawSnapshot]
  )
  const [manualState, setManualState] = useState<PlayerState>("intro")
  const [manualIndex, setManualIndex] = useState(0)
  const [manualSelected, setManualSelected] = useState<
    Record<string, string[]>
  >({})

  const [sessionId, setSessionId] = useState(() => crypto.randomUUID())
  const trackedViewRef = useRef(false)
  const trackedCompleteRef = useRef(false)
  const advanceTokenRef = useRef(0)
  const advanceTimerRef = useRef<number | null>(null)
  const subsetSessionRef = useRef<SubsetSession | null>(null)
  const trackingEnabled = Boolean(quizId) && !isPreview

  const pool = useMemo(
    () =>
      [...snapshot.questions]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((question) => ({
          ...question,
          answers: [...question.answers].sort(
            (a, b) => a.sort_order - b.sort_order
          ),
        })),
    [snapshot.questions]
  )

  const outcomes = useMemo(
    () => [...snapshot.outcomes].sort((a, b) => a.sort_order - b.sort_order),
    [snapshot.outcomes]
  )

  const attemptSize = useMemo(
    () =>
      resolveQuestionsPerAttempt(
        snapshot.random_question_subset,
        snapshot.questions_per_attempt,
        pool.length
      ),
    [
      pool.length,
      snapshot.questions_per_attempt,
      snapshot.random_question_subset,
    ]
  )
  const subsetActive = attemptSize < pool.length
  const storageKey =
    subsetActive && quizId ? attemptStorageKey(quizId, isPreview) : null
  const storedRaw = useSyncExternalStore(
    subscribeAttemptStorage,
    () => readAttemptStorageSnapshot(storageKey),
    () => getAttemptStorageServerSnapshot(storageKey)
  )
  const attemptReady = !isAttemptStoragePending(storedRaw)
  const restored = useMemo(() => {
    if (!subsetActive || !attemptReady || !storedRaw) {
      return null
    }

    const stored = parseStoredQuizAttempt(storedRaw)
    const persisted = stored
      ? resolvePersistedQuestions(pool, stored.questionIds, attemptSize)
      : null

    if (!stored || !persisted) {
      return null
    }

    const sanitized = selectionForShownQuestions(
      persisted,
      stored.selectedByQuestion
    )

    return {
      state: stored.state,
      questionIndex: Math.min(stored.questionIndex, persisted.length - 1),
      selectedByQuestion: sanitized.selectedByQuestion,
      chosenQuestions: persisted,
    }
  }, [attemptReady, attemptSize, pool, storedRaw, subsetActive])
  const [subsetSession, setSubsetSession] = useState<SubsetSession | null>(null)
  const chosenQuestions = subsetActive
    ? (subsetSession?.chosenQuestions ?? restored?.chosenQuestions ?? null)
    : null
  const questions = useMemo(
    () => (subsetActive ? (chosenQuestions ?? []) : pool),
    [chosenQuestions, pool, subsetActive]
  )
  const state: PlayerState = subsetActive
    ? (subsetSession?.state ?? restored?.state ?? "intro")
    : manualState
  const questionIndex = subsetActive
    ? (subsetSession?.questionIndex ?? restored?.questionIndex ?? 0)
    : manualIndex
  const selectedByQuestion = subsetActive
    ? (subsetSession?.selectedByQuestion ??
      restored?.selectedByQuestion ??
      EMPTY_SELECTION)
    : manualSelected

  const currentQuestion = questions[questionIndex]
  const selectedForCurrent = currentQuestion
    ? (selectedByQuestion[currentQuestion.id] ?? [])
    : []

  const allAnswers = useMemo(
    () => questions.flatMap((question) => question.answers),
    [questions]
  )

  const allSelectedAnswerIds = useMemo(
    () => selectionForShownQuestions(questions, selectedByQuestion).answerIds,
    [questions, selectedByQuestion]
  )

  const tieBreakSeed = questions.map((question) => question.id).join("\u0000")

  const winningOutcome = useMemo(() => {
    const winner = calculateWinningOutcome(
      outcomes,
      allSelectedAnswerIds,
      allAnswers,
      tieBreakSeed
    )
    return winner
      ? (outcomes.find((outcome) => outcome.id === winner.id) ?? outcomes[0])
      : outcomes[0]
  }, [allAnswers, allSelectedAnswerIds, outcomes, tieBreakSeed])

  useEffect(() => {
    if (!subsetActive || !attemptReady) {
      return
    }

    document.documentElement.removeAttribute("data-quiz-attempt")
  }, [attemptReady, subsetActive])

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current != null) {
        window.clearTimeout(advanceTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!storageKey || !attemptReady || storedRaw === "") {
      return
    }

    if (restored) {
      return
    }

    localStorage.removeItem(storageKey)
    notifyAttemptStorage()
  }, [attemptReady, restored, storageKey, storedRaw])

  useEffect(() => {
    if (!trackingEnabled || !quizId || trackedViewRef.current) {
      return
    }

    trackedViewRef.current = true
    trackEvent({
      event: "view",
      quizId,
      sessionId,
      anonymousId: getAnonymousId(),
      ...getTrackingContext(),
    })
  }, [quizId, sessionId, trackingEnabled])

  function computeWinningOutcomeFromSelection(
    selection: Record<string, string[]>
  ) {
    const selectedAnswerIds = selectionForShownQuestions(
      questions,
      selection
    ).answerIds
    const winner = calculateWinningOutcome(
      outcomes,
      selectedAnswerIds,
      allAnswers,
      tieBreakSeed
    )

    return winner
      ? (outcomes.find((outcome) => outcome.id === winner.id) ?? outcomes[0])
      : outcomes[0]
  }

  function trackQuizComplete(selection: Record<string, string[]>) {
    if (!trackingEnabled || !quizId || trackedCompleteRef.current) {
      return
    }

    const outcome = computeWinningOutcomeFromSelection(selection)
    if (!outcome) {
      return
    }

    trackedCompleteRef.current = true
    trackEvent({
      event: "complete",
      quizId,
      sessionId,
      resultId: outcome.id,
      outcomeId: outcome.id,
    })
  }

  function persistSubset(next: SubsetSession) {
    subsetSessionRef.current = next
    setSubsetSession(next)

    if (!storageKey) {
      return
    }

    if (next.state === "intro" || !next.chosenQuestions) {
      localStorage.removeItem(storageKey)
    } else {
      writeStoredQuizAttempt(localStorage, storageKey, {
        questionIds: next.chosenQuestions.map((question) => question.id),
        selectedByQuestion: next.selectedByQuestion,
        questionIndex: next.questionIndex,
        state: next.state,
      })
    }

    notifyAttemptStorage()
  }

  function currentSubsetSession(): SubsetSession {
    if (subsetSessionRef.current) {
      return subsetSessionRef.current
    }

    return restored
      ? {
          state: restored.state,
          questionIndex: restored.questionIndex,
          selectedByQuestion: restored.selectedByQuestion,
          chosenQuestions: restored.chosenQuestions,
        }
      : {
          state: "intro",
          questionIndex: 0,
          selectedByQuestion: EMPTY_SELECTION,
          chosenQuestions: null,
        }
  }

  function cancelScheduledAdvance() {
    advanceTokenRef.current += 1

    if (advanceTimerRef.current != null) {
      window.clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }
  }

  function scheduleAdvance(run: () => void) {
    cancelScheduledAdvance()
    const token = advanceTokenRef.current
    advanceTimerRef.current = window.setTimeout(() => {
      if (advanceTokenRef.current !== token) {
        return
      }

      advanceTimerRef.current = null
      run()
    }, SINGLE_CHOICE_ADVANCE_MS)
  }

  function commitPlaying(
    selection: Record<string, string[]>,
    nextState: PlayerState,
    nextIndex: number
  ) {
    if (subsetActive) {
      const current = currentSubsetSession()
      persistSubset({
        ...current,
        selectedByQuestion: selection,
        state: nextState,
        questionIndex: nextIndex,
      })
      return
    }

    setManualSelected(selection)
    setManualState(nextState)
    setManualIndex(nextIndex)
  }

  function resetQuiz() {
    cancelScheduledAdvance()
    setSessionId(crypto.randomUUID())
    trackedCompleteRef.current = false

    if (subsetActive) {
      persistSubset({
        state: "intro",
        questionIndex: 0,
        selectedByQuestion: EMPTY_SELECTION,
        chosenQuestions: null,
      })
      return
    }

    setManualState("intro")
    setManualIndex(0)
    setManualSelected({})
  }

  function trackAnswers(questionId: string, answerIds: string[]) {
    if (!trackingEnabled || answerIds.length === 0) {
      return
    }

    trackEvent({
      event: "answer",
      sessionId,
      questionId,
      answerIds,
    })
  }

  function goBack() {
    if (questionIndex <= 0) {
      return
    }

    cancelScheduledAdvance()
    commitPlaying(selectedByQuestion, "playing", questionIndex - 1)
  }

  function startQuiz() {
    cancelScheduledAdvance()

    if (subsetActive) {
      const current = currentSubsetSession()
      persistSubset({
        state: "playing",
        questionIndex: 0,
        selectedByQuestion: current.chosenQuestions
          ? current.selectedByQuestion
          : EMPTY_SELECTION,
        chosenQuestions:
          current.chosenQuestions ?? pickRandomQuestions(pool, attemptSize),
      })
    } else {
      setManualState("playing")
    }

    if (trackingEnabled && quizId) {
      trackEvent({
        event: "start",
        quizId,
        sessionId,
        anonymousId: getAnonymousId(),
        ...getTrackingContext(),
      })
    }
  }

  function toggleAnswer(answerId: string) {
    if (!currentQuestion) return

    const previous = selectedByQuestion[currentQuestion.id] ?? []
    const nextAnswers = currentQuestion.allow_multiple
      ? previous.includes(answerId)
        ? previous.filter((id) => id !== answerId)
        : [...previous, answerId]
      : [answerId]
    const updated = {
      ...selectedByQuestion,
      [currentQuestion.id]: nextAnswers,
    }

    if (currentQuestion.allow_multiple) {
      commitPlaying(
        updated,
        state === "intro" ? "playing" : state,
        questionIndex
      )
      return
    }

    const questionId = currentQuestion.id
    const finished = questionIndex >= questions.length - 1
    const nextIndex = finished ? questionIndex : questionIndex + 1
    const nextState: PlayerState = finished ? "result" : "playing"

    commitPlaying(updated, "playing", questionIndex)
    scheduleAdvance(() => {
      trackAnswers(questionId, nextAnswers)
      if (finished) {
        trackQuizComplete(updated)
      }
      commitPlaying(updated, nextState, nextIndex)
    })
  }

  function submitMultiple() {
    if (!currentQuestion) {
      return
    }

    cancelScheduledAdvance()

    const updated = {
      ...selectedByQuestion,
      [currentQuestion.id]: selectedForCurrent,
    }
    const finished = questionIndex >= questions.length - 1

    trackAnswers(currentQuestion.id, selectedForCurrent)

    if (finished) {
      trackQuizComplete(updated)
    }

    commitPlaying(
      updated,
      finished ? "result" : "playing",
      finished ? questionIndex : questionIndex + 1
    )
  }

  const showAttemptBootstrap =
    subsetActive && Boolean(storageKey) && !attemptReady
  const progress = quizProgressPercent(
    answeredQuestionCount(questions, selectedByQuestion),
    questions.length
  )

  if (state === "intro") {
    return (
      <>
        {showAttemptBootstrap && storageKey ? (
          <>
            <script
              dangerouslySetInnerHTML={{
                __html: attemptRestoreBootstrapScript(storageKey),
              }}
            />
            <div className="quiz-attempt-placeholder mx-auto hidden min-h-[70vh] w-full max-w-2xl" />
          </>
        ) : null}
        <div
          className={cn(
            "mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col justify-center gap-8 px-6 py-12",
            showAttemptBootstrap && "quiz-attempt-pending"
          )}
        >
          {children ?? (
            <>
              {isPreview ? (
                <p className="text-center text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Author preview — draft content
                </p>
              ) : null}

              {snapshot.cover_image_url ? (
                <div className="relative mx-auto aspect-[4/3] w-full max-w-md overflow-hidden rounded-2xl border border-border/60">
                  <Image
                    src={snapshot.cover_image_url}
                    alt={`Cover for ${snapshot.quiz_title}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 28rem"
                    priority
                    unoptimized={snapshot.cover_image_url.startsWith("data:")}
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
                  {formatQuestionCount(attemptSize)} · {outcomes.length}{" "}
                  possible results
                </p>
              </div>
            </>
          )}

          <Button
            type="button"
            size="lg"
            className="mx-auto rounded-full px-8"
            onClick={startQuiz}
          >
            Start the quiz
          </Button>
        </div>
      </>
    )
  }

  if (state === "result" && winningOutcome) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col justify-center gap-8 px-6 py-12">
        <OutcomeResultBody outcome={winningOutcome}>
          {winningOutcome.image_url ? (
            <div className="relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-2xl border border-border/60">
              <Image
                src={winningOutcome.image_url}
                alt={`${winningOutcome.name} from ${snapshot.quiz_title}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 80vw, 20rem"
                unoptimized={winningOutcome.image_url.startsWith("data:")}
              />
            </div>
          ) : null}
        </OutcomeResultBody>

        <div className="flex flex-wrap justify-center gap-3">
          {trackingEnabled && quizId ? (
            <QuizShareButton
              quizId={quizId}
              sessionId={sessionId}
              quizTitle={snapshot.quiz_title}
              bookTitle={snapshot.book_title}
              outcomeName={winningOutcome.name}
            />
          ) : null}
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

        <QuizResultLinks
          bookTitle={snapshot.book_title}
          {...snapshotReaderLinks(snapshot)}
          onBookClick={() => {
            if (!trackingEnabled || !quizId) {
              return
            }

            trackEvent({
              event: "book_cta_click",
              quizId,
              sessionId,
            })
          }}
        />
      </div>
    )
  }

  if (!currentQuestion) {
    return null
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col gap-8 px-6 py-12">
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Question {questionIndex + 1} of {questions.length}
          </span>
          <span>{snapshot.book_title}</span>
        </div>
        <Progress
          value={progress}
          aria-label="Quiz progress"
          aria-valuetext={`${Math.round(progress)}%`}
        />
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            {currentQuestion.question_text}
          </h2>
          {currentQuestion.allow_multiple ? (
            <p className="text-sm text-muted-foreground">
              Choose all that apply
            </p>
          ) : null}
        </div>

        <div className="grid gap-3">
          {currentQuestion.answers.map((answer) => {
            const selected = selectedForCurrent.includes(answer.id)
            return (
              <button
                key={answer.id}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleAnswer(answer.id)}
                className={cn(
                  "rounded-xl border px-4 py-4 text-left text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
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

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={questionIndex === 0}
            onClick={goBack}
          >
            Back
          </Button>
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
    </div>
  )
}

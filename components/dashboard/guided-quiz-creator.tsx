"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2, BookOpen, Wand2, X } from "lucide-react"
import { toast } from "sonner"

import { saveAiGeneratedQuiz } from "@/app/actions/ai"
import { AiQuizPreview } from "@/components/dashboard/ai-quiz-preview"
import { UpgradePrompt } from "@/components/subscription/upgrade-prompt"
import { Button } from "@/components/ui/button"
import { readNdjsonStream } from "@/lib/ai/ndjson"
import { showAiLimitToast } from "@/lib/ai/show-ai-limit-toast"
import type { BookResearchResult } from "@/lib/ai/book-research"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { GeneratedQuiz } from "@/lib/ai/schemas"
import { generateSlug } from "@/lib/quiz/slug"

type GuidedQuizCreatorProps = {
  canUseAI: boolean
  defaultAuthorName?: string
  onUpgrade?: () => void
}

function parseOutcomes(text: string) {
  return text
    .split(/[\n,]+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

export function GuidedQuizCreator({
  canUseAI,
  defaultAuthorName = "",
  onUpgrade,
}: GuidedQuizCreatorProps) {
  const router = useRouter()
  const [isWorking, startWork] = useTransition()
  const [isSaving, startSave] = useTransition()

  const [authorName, setAuthorName] = useState(defaultAuthorName)
  const [bookTitle, setBookTitle] = useState("")
  const [synopsis, setSynopsis] = useState("")
  const [outcomesText, setOutcomesText] = useState("")
  const [slug, setSlug] = useState("")

  const [bookResearch, setBookResearch] = useState<BookResearchResult | null>(
    null
  )
  const [generatedQuiz, setGeneratedQuiz] = useState<GeneratedQuiz | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")

  const isBusy = isWorking

  if (!canUseAI) {
    return (
      <UpgradePrompt
        title="Included credits used"
        description="Start the author plan to unlock guided quiz creation, or build manually."
      />
    )
  }

  function validateIntake() {
    if (bookTitle.trim().length === 0) {
      toast.error("Book title is required.")
      return false
    }

    if (synopsis.trim().length < 20) {
      toast.error("Synopsis must be at least 20 characters.")
      return false
    }

    const outcomes = parseOutcomes(outcomesText)
    if (outcomes.length > 0 && outcomes.length < 2) {
      toast.error("Add at least 2 outcomes, or leave blank for us to choose.")
      return false
    }

    return true
  }

  function handleGenerate() {
    if (!validateIntake()) {
      return
    }

    setGeneratedQuiz(null)
    setShowPreview(false)
    setBookResearch(null)
    setStatusMessage("Starting...")

    startWork(async () => {
      try {
      const outcomes = parseOutcomes(outcomesText)

      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          book_title: bookTitle.trim(),
          synopsis: synopsis.trim(),
          author_name: authorName.trim() || undefined,
          outcomes: outcomes.length >= 2 ? outcomes : undefined,
          run_book_research: true,
          stream: true,
          character_count:
            outcomes.length >= 2 ? outcomes.length : undefined,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string
        }

        if (
          payload.error === "SUBSCRIPTION_REQUIRED" ||
          payload.error === "AI_LIMIT_REACHED"
        ) {
          showAiLimitToast({ onUpgrade })
          return
        }

        toast.error(payload.error ?? "Could not generate quiz.")
        return
      }

      const streamResult: {
        quiz: GeneratedQuiz | null
        research: BookResearchResult | null
      } = { quiz: null, research: null }

      type GenerateQuizStreamEvent = {
        type: "status" | "research" | "partial" | "done" | "error"
        message?: string
        research?: BookResearchResult
        quiz?: GeneratedQuiz
        error?: string
      }

      await readNdjsonStream<GenerateQuizStreamEvent>(response, (event) => {
        if (event.type === "status" && event.message) {
          setStatusMessage(event.message)
        }

        if (event.type === "research" && event.research) {
          streamResult.research = event.research
          setBookResearch(event.research)
        }

        if (event.type === "error") {
          throw new Error(event.error ?? "Could not generate quiz.")
        }

        if (event.type === "done" && event.quiz) {
          streamResult.quiz = event.quiz
          streamResult.research = event.research ?? streamResult.research
        }
      })

      if (!streamResult.quiz) {
        toast.error("Could not generate quiz.")
        return
      }

      if (streamResult.research?.found) {
        toast.success("Book research ready")
      } else if (streamResult.research) {
        toast.message(
          "Couldn't find extra details — quiz will use your synopsis"
        )
      }

      setGeneratedQuiz(streamResult.quiz)
      setShowPreview(true)
      if (!slug) {
        setSlug(generateSlug(bookTitle))
      }
      toast.success("Quiz draft ready for review")
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not generate quiz."
        )
      }
    })
  }

  function handleReject() {
    setGeneratedQuiz(null)
    setShowPreview(false)
  }

  function handleApprove() {
    if (!generatedQuiz) {
      return
    }

    startSave(async () => {
      const result = await saveAiGeneratedQuiz({
        bookTitle: bookTitle.trim(),
        slug: slug.trim() || undefined,
        generated: generatedQuiz,
      })

      if (result?.error) {
        toast.error(result.error)
        return
      }

      router.refresh()
    })
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <Card className="h-fit bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="size-4 text-primary" />
            Book details
          </CardTitle>
          <CardDescription>
            Tell us about your book. We&apos;ll research it and draft a
            quiz for your review.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="author_name">Author name</FieldLabel>
              <Input
                id="author_name"
                value={authorName}
                onChange={(event) => setAuthorName(event.target.value)}
                placeholder="Jane Austen"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="book_title">Book title</FieldLabel>
              <Input
                id="book_title"
                value={bookTitle}
                onChange={(event) => setBookTitle(event.target.value)}
                placeholder="The Midnight Library"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="synopsis">Synopsis</FieldLabel>
              <FieldDescription>
                Your summary of the story, themes, and characters. At least 20
                characters.
              </FieldDescription>
              <Textarea
                id="synopsis"
                value={synopsis}
                onChange={(event) => setSynopsis(event.target.value)}
                rows={5}
                placeholder="Summarize the story, themes, and main characters..."
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="outcomes">Outcomes (optional)</FieldLabel>
              <FieldDescription>
                Define result types — one per line or comma-separated. Leave
                blank and we&apos;ll choose characters.
              </FieldDescription>
              <Textarea
                id="outcomes"
                value={outcomesText}
                onChange={(event) => setOutcomesText(event.target.value)}
                rows={4}
                placeholder={"Emma\nMr. Knightley\nHarriet"}
              />
            </Field>
            {showPreview ? (
              <Field>
                <FieldLabel htmlFor="slug">Public URL slug</FieldLabel>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(event) =>
                    setSlug(generateSlug(event.target.value))
                  }
                  placeholder="the-midnight-library"
                />
              </Field>
            ) : null}
          </FieldGroup>

          {!showPreview ? (
            <Button
              type="button"
              className="rounded-full"
              disabled={isBusy}
              onClick={handleGenerate}
            >
              {isBusy ? (
                <Loader2 className="animate-spin" data-icon="inline-start" />
              ) : (
                <Wand2 data-icon="inline-start" />
              )}
              {isWorking
                ? statusMessage || "Researching book..."
                : "Generate quiz draft"}
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <div className="space-y-4">
        {bookResearch?.found ? (
          <Card className="border-primary/10 bg-card/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Book research</CardTitle>
              <CardDescription>
                {bookResearch.title}
                {bookResearch.authors?.length
                  ? ` by ${bookResearch.authors.join(", ")}`
                  : ""}
                {bookResearch.genre ? ` · ${bookResearch.genre}` : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {bookResearch.description ? (
                <p className="text-sm text-muted-foreground">
                  {bookResearch.description}
                </p>
              ) : null}
              {bookResearch.mainCharacters?.length ? (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    Characters:{" "}
                  </span>
                  {bookResearch.mainCharacters.join(", ")}
                </p>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {showPreview && generatedQuiz ? (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-base">Review your quiz draft</CardTitle>
              <CardDescription>
                Approve to save as a draft quiz, or reject to adjust your
                inputs and regenerate.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <AiQuizPreview quiz={generatedQuiz} />

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="rounded-full"
                  disabled={isSaving}
                  onClick={handleApprove}
                >
                  <Check data-icon="inline-start" />
                  {isSaving ? "Saving..." : "Approve & save draft"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  disabled={isSaving}
                  onClick={handleReject}
                >
                  <X data-icon="inline-start" />
                  Reject & revise
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed bg-card/60">
            <CardContent className="flex min-h-80 items-center justify-center p-8 text-center text-sm text-muted-foreground">
              {isWorking
                ? statusMessage || "Researching your book and drafting a quiz..."
                : "Fill in your book details and generate a draft to preview here."}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

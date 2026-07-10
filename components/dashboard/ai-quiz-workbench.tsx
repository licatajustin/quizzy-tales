"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, BookOpen, Wand2 } from "lucide-react"
import { toast } from "sonner"

import { saveAiGeneratedQuiz } from "@/app/actions/ai"
import { AiQuizPreview } from "@/components/dashboard/ai-quiz-preview"
import { UpgradePrompt } from "@/components/subscription/upgrade-prompt"
import { Button } from "@/components/ui/button"
import { showAiLimitToast } from "@/lib/ai/show-ai-limit-toast"
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

type AiQuizWorkbenchProps = {
  canUseAI: boolean
  onUpgrade?: () => void
  initialBookTitle?: string
  initialSynopsis?: string
  initialCharacterCount?: number
  initialTone?: "playful" | "thoughtful" | "dramatic" | "whimsical"
  initialQuestionStyle?: "scenario" | "preference" | "mixed"
  initialIncludeDescriptions?: boolean
  onSave?: (input: {
    bookTitle: string
    generated: GeneratedQuiz
  }) => Promise<{ error?: string } | void>
  saveLabel?: string
}

export function AiQuizWorkbench({
  canUseAI,
  onUpgrade,
  initialBookTitle = "",
  initialSynopsis = "",
  initialCharacterCount = 4,
  initialTone = "thoughtful",
  initialQuestionStyle = "mixed",
  initialIncludeDescriptions = true,
  onSave,
  saveLabel = "Save draft quiz",
}: AiQuizWorkbenchProps) {
  const router = useRouter()
  const [isGenerating, startGenerate] = useTransition()
  const [isSaving, startSave] = useTransition()
  const [bookTitle, setBookTitle] = useState(initialBookTitle)
  const [synopsis, setSynopsis] = useState(initialSynopsis)
  const [quizTitle, setQuizTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [characterCount, setCharacterCount] = useState(initialCharacterCount)
  const [tone, setTone] = useState(initialTone)
  const [questionStyle, setQuestionStyle] = useState(initialQuestionStyle)
  const includeDescriptions = initialIncludeDescriptions
  const [generatedQuiz, setGeneratedQuiz] = useState<GeneratedQuiz | null>(null)

  if (!canUseAI) {
    return (
      <UpgradePrompt
        title="Included credits used"
        description="Start the author plan to unlock the full builder, or create quizzes manually."
      />
    )
  }

  function handleGenerate() {
    if (bookTitle.trim().length === 0) {
      toast.error("Book title is required.")
      return
    }

    if (synopsis.trim().length < 20) {
      toast.error("Synopsis must be at least 20 characters.")
      return
    }

    startGenerate(async () => {
      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          book_title: bookTitle.trim(),
          synopsis: synopsis.trim(),
          character_count: characterCount,
          quiz_title: quizTitle.trim() || undefined,
          tone,
          question_style: questionStyle,
          include_descriptions: includeDescriptions,
        }),
      })

      const payload = (await response.json()) as {
        quiz?: GeneratedQuiz
        error?: string
      }

      if (!response.ok || !payload.quiz) {
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

      setGeneratedQuiz(payload.quiz)
      if (!slug) {
        setSlug(generateSlug(bookTitle))
      }
      toast.success("Quiz generated")
    })
  }

  function handleSave() {
    if (!generatedQuiz) {
      return
    }

    startSave(async () => {
      if (onSave) {
        const result = await onSave({
          bookTitle: bookTitle.trim(),
          generated: generatedQuiz,
        })

        if (result?.error) {
          toast.error(result.error)
        }

        return
      }

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
            Draft from your book
          </CardTitle>
          <CardDescription>
            Describe your book and we&apos;ll draft outcomes, questions, and
            weighted scoring.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FieldGroup>
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
              <FieldLabel htmlFor="synopsis">Book synopsis</FieldLabel>
              <FieldDescription>
                At least 20 characters. More detail yields better character
                outcomes.
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
              <FieldLabel htmlFor="quiz_title">Quiz title (optional)</FieldLabel>
              <Input
                id="quiz_title"
                value={quizTitle}
                onChange={(event) => setQuizTitle(event.target.value)}
                placeholder="Which character are you?"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="character_count">
                Character count: {characterCount}
              </FieldLabel>
              <input
                id="character_count"
                type="range"
                min={3}
                max={6}
                value={characterCount}
                onChange={(event) =>
                  setCharacterCount(Number(event.target.value))
                }
                className="w-full accent-primary"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="tone">Tone</FieldLabel>
              <select
                id="tone"
                value={tone}
                onChange={(event) =>
                  setTone(
                    event.target.value as
                      | "playful"
                      | "thoughtful"
                      | "dramatic"
                      | "whimsical"
                  )
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="playful">Playful</option>
                <option value="thoughtful">Thoughtful</option>
                <option value="dramatic">Dramatic</option>
                <option value="whimsical">Whimsical</option>
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="question_style">Question style</FieldLabel>
              <select
                id="question_style"
                value={questionStyle}
                onChange={(event) =>
                  setQuestionStyle(
                    event.target.value as "scenario" | "preference" | "mixed"
                  )
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="scenario">Scenario</option>
                <option value="preference">Preference</option>
                <option value="mixed">Mixed</option>
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="slug">Public URL slug (on save)</FieldLabel>
              <Input
                id="slug"
                value={slug}
                onChange={(event) => setSlug(generateSlug(event.target.value))}
                placeholder="the-midnight-library"
              />
            </Field>
          </FieldGroup>

          <Button
            type="button"
            className="rounded-full"
            disabled={isGenerating}
            onClick={handleGenerate}
          >
            {isGenerating ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : (
              <Wand2 data-icon="inline-start" />
            )}
            {isGenerating ? "Generating..." : "Generate quiz"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {generatedQuiz ? (
          <>
            <AiQuizPreview quiz={generatedQuiz} />
            <Button
              type="button"
              className="rounded-full"
              disabled={isSaving}
              onClick={handleSave}
            >
              {isSaving ? "Saving..." : saveLabel}
            </Button>
          </>
        ) : (
          <Card className="border-dashed bg-card/60">
            <CardContent className="flex min-h-80 items-center justify-center p-8 text-center text-sm text-muted-foreground">
              Generate a quiz to preview outcomes and questions here.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

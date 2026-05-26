"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { updateQuizDetails } from "@/app/actions/quizzes"
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
import { generateSlug } from "@/lib/quiz/slug"
import type { QuizRow } from "@/lib/quiz/types"

type DetailsTabProps = {
  quiz: QuizRow
}

export function DetailsTab({ quiz }: DetailsTabProps) {
  const [bookTitle, setBookTitle] = useState(quiz.book_title)
  const [quizTitle, setQuizTitle] = useState(quiz.quiz_title)
  const [slug, setSlug] = useState(quiz.slug)
  const [coverImageUrl, setCoverImageUrl] = useState(quiz.cover_image_url ?? "")
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRun = useRef(true)

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(async () => {
      setSaveState("saving")
      const result = await updateQuizDetails(quiz.id, {
        book_title: bookTitle,
        quiz_title: quizTitle,
        slug: generateSlug(slug),
        cover_image_url: coverImageUrl || null,
      })

      if (result.error) {
        toast.error(result.error)
        setSaveState("idle")
        return
      }

      setSaveState("saved")
      toast.success("Quiz details saved")
    }, 700)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [bookTitle, quizTitle, slug, coverImageUrl, quiz.id])

  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle>Quiz details</CardTitle>
          <CardDescription>
            Set the title, share link, and cover image readers see when they
            open your quiz. Saves as you type.
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
          <Field>
            <FieldLabel htmlFor="book_title">Book title</FieldLabel>
            <Input
              id="book_title"
              value={bookTitle}
              onChange={(event) => setBookTitle(event.target.value)}
            />
            <FieldDescription>
              Match the cover — this is how readers recognize your book.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="quiz_title">Quiz title</FieldLabel>
            <Input
              id="quiz_title"
              value={quizTitle}
              onChange={(event) => setQuizTitle(event.target.value)}
            />
            <FieldDescription>
              The hook on your quiz page. Try &ldquo;Which character are
              you?&rdquo;
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="slug">Public slug</FieldLabel>
            <Input
              id="slug"
              value={slug}
              onChange={(event) => setSlug(generateSlug(event.target.value))}
            />
            <FieldDescription>
              Your share link: /q/{slug || "your-slug"}. Use lowercase letters,
              numbers, and hyphens only.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="cover_image_url">Cover image URL</FieldLabel>
            <Input
              id="cover_image_url"
              value={coverImageUrl}
              onChange={(event) => setCoverImageUrl(event.target.value)}
              placeholder="https://..."
            />
            <FieldDescription>
              Optional. Paste a direct image link to show your book cover on the
              quiz page.
            </FieldDescription>
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  )
}

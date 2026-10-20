"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { updateQuizDetails } from "@/app/actions/quizzes"
import { CoverImageControls } from "@/components/dashboard/quiz-editor/cover-image-controls"
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { INTRO_TEXT_MAX } from "@/lib/quiz/intro-text"
import { normalizeHttpUrl } from "@/lib/quiz/reader-links"
import { generateSlug } from "@/lib/quiz/slug"
import type { QuizRow } from "@/lib/quiz/types"

const HTTP_URL_ERROR = "Use a full http or https link, including https://."

type DetailsTabProps = {
  quiz: QuizRow
}

export function DetailsTab({ quiz }: DetailsTabProps) {
  const [bookTitle, setBookTitle] = useState(quiz.book_title)
  const [quizTitle, setQuizTitle] = useState(quiz.quiz_title)
  const [introText, setIntroText] = useState(quiz.intro_text ?? "")
  const [slug, setSlug] = useState(quiz.slug)
  const [bookUrl, setBookUrl] = useState(quiz.book_url ?? "")
  const [newsletterUrl, setNewsletterUrl] = useState(quiz.newsletter_url ?? "")
  const [coverImageUrl, setCoverImageUrl] = useState(quiz.cover_image_url)
  const coverImageUrlRef = useRef(coverImageUrl)
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle"
  )
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRun = useRef(true)

  useEffect(() => {
    coverImageUrlRef.current = coverImageUrl
  }, [coverImageUrl])

  const bookLink = normalizeHttpUrl(bookUrl)
  const newsletterLink = normalizeHttpUrl(newsletterUrl)
  const bookUrlError = bookLink.ok ? null : HTTP_URL_ERROR
  const newsletterUrlError = newsletterLink.ok ? null : HTTP_URL_ERROR

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }

    const nextBookLink = normalizeHttpUrl(bookUrl)
    const nextNewsletterLink = normalizeHttpUrl(newsletterUrl)

    if (!nextBookLink.ok || !nextNewsletterLink.ok) {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
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
        intro_text: introText,
        cover_image_url: coverImageUrlRef.current,
        book_url: nextBookLink.url,
        newsletter_url: nextNewsletterLink.url,
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
  }, [bookTitle, introText, quizTitle, slug, bookUrl, newsletterUrl, quiz.id])

  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle>Quiz details</CardTitle>
          <CardDescription>
            Set the title, hook line, share link, cover image, and the book or
            newsletter links readers see on the result screen. Saves as you
            type. On a live quiz, those links update as soon as they save. A
            draft shows them after you publish.
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
              The title readers see. Try &ldquo;Which character are you?&rdquo;
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="intro_text">Hook line</FieldLabel>
            <Textarea
              id="intro_text"
              value={introText}
              maxLength={INTRO_TEXT_MAX}
              rows={3}
              onChange={(event) => setIntroText(event.target.value)}
              placeholder="A short line readers see before they start."
            />
            <FieldDescription>
              Optional. Shown under the title, and used as the description when
              someone shares your quiz. Leave blank for the standard line.
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
          <Field data-invalid={bookUrlError ? true : undefined}>
            <FieldLabel htmlFor="book_url">Book link</FieldLabel>
            <Input
              id="book_url"
              type="url"
              inputMode="url"
              autoCapitalize="off"
              spellCheck={false}
              placeholder="https://"
              value={bookUrl}
              aria-invalid={bookUrlError ? true : undefined}
              onChange={(event) => setBookUrl(event.target.value)}
            />
            <FieldDescription>
              Readers see a Read {bookTitle.trim() || "the book"} button. Use
              the Amazon page or any other store link.
            </FieldDescription>
            <FieldError>{bookUrlError}</FieldError>
          </Field>
          <Field data-invalid={newsletterUrlError ? true : undefined}>
            <FieldLabel htmlFor="newsletter_url">Newsletter link</FieldLabel>
            <Input
              id="newsletter_url"
              type="url"
              inputMode="url"
              autoCapitalize="off"
              spellCheck={false}
              placeholder="https://"
              value={newsletterUrl}
              aria-invalid={newsletterUrlError ? true : undefined}
              onChange={(event) => setNewsletterUrl(event.target.value)}
            />
            <FieldDescription>
              Optional. Readers see a Join the newsletter button when this is
              set.
            </FieldDescription>
            <FieldError>{newsletterUrlError}</FieldError>
          </Field>
          <CoverImageControls
            quizId={quiz.id}
            imageUrl={coverImageUrl}
            onImageChange={setCoverImageUrl}
          />
        </FieldGroup>
      </CardContent>
    </Card>
  )
}

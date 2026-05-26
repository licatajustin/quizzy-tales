"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { createQuiz } from "@/app/actions/quizzes"
import { Button } from "@/components/ui/button"
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

export function NewQuizForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [bookTitle, setBookTitle] = useState("")
  const [quizTitle, setQuizTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [slugEdited, setSlugEdited] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slugEdited) {
      setSlug(generateSlug(bookTitle || quizTitle))
    }
  }, [bookTitle, quizTitle, slugEdited])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const formData = new FormData()
    formData.set("book_title", bookTitle)
    formData.set("quiz_title", quizTitle)
    formData.set("slug", slug)

    startTransition(async () => {
      const result = await createQuiz(formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <Card className="max-w-xl bg-card">
      <CardHeader>
        <CardTitle>Create a quiz</CardTitle>
        <CardDescription>
          Start with the basics. You can add outcomes and questions in the editor.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="book_title">Book title</FieldLabel>
              <FieldDescription>
                The book this quiz is based on.
              </FieldDescription>
              <Input
                id="book_title"
                value={bookTitle}
                onChange={(event) => setBookTitle(event.target.value)}
                placeholder="The Midnight Library"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="quiz_title">Quiz title</FieldLabel>
              <FieldDescription>
                What readers see when they start the quiz.
              </FieldDescription>
              <Input
                id="quiz_title"
                value={quizTitle}
                onChange={(event) => setQuizTitle(event.target.value)}
                placeholder="Which character are you?"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="slug">Public URL slug</FieldLabel>
              <FieldDescription>
                Share link: /q/{slug || "your-slug"}. Auto-generated from the
                book title unless you edit it.
              </FieldDescription>
              <Input
                id="slug"
                value={slug}
                onChange={(event) => {
                  setSlugEdited(true)
                  setSlug(generateSlug(event.target.value))
                }}
                placeholder="the-midnight-library"
                required
              />
            </Field>
          </FieldGroup>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" className="rounded-full" disabled={isPending}>
            {isPending ? "Creating..." : "Create draft quiz"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

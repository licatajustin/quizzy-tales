"use client"

import { BookOpen, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"

type QuizResultLinksProps = {
  bookTitle: string
  bookUrl: string | null
  newsletterUrl: string | null
  authorDisplayName: string | null
  onBookClick?: () => void
}

export function QuizResultLinks({
  bookTitle,
  bookUrl,
  newsletterUrl,
  authorDisplayName,
  onBookClick,
}: QuizResultLinksProps) {
  if (!bookUrl && !newsletterUrl) {
    return null
  }

  return (
    <div className="space-y-4 text-center">
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">
          Continue the story
        </p>
        {authorDisplayName ? (
          <p className="text-sm text-muted-foreground">
            by {authorDisplayName}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {bookUrl ? (
          <Button
            asChild
            className="h-auto max-w-full rounded-full text-center whitespace-normal"
          >
            <a
              href={bookUrl}
              target="_blank"
              rel="noopener"
              onClick={onBookClick}
            >
              <BookOpen data-icon="inline-start" />
              Read {bookTitle}
            </a>
          </Button>
        ) : null}
        {newsletterUrl ? (
          <Button
            asChild
            variant="outline"
            className="h-auto max-w-full rounded-full text-center whitespace-normal"
          >
            <a href={newsletterUrl} target="_blank" rel="noopener">
              <Mail data-icon="inline-start" />
              Join the newsletter
            </a>
          </Button>
        ) : null}
      </div>
    </div>
  )
}

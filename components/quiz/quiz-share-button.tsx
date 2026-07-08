"use client"

import { useState } from "react"
import { Check, Share2 } from "lucide-react"

import { trackEvent } from "@/lib/analytics/client"
import { Button } from "@/components/ui/button"

type QuizShareButtonProps = {
  quizId: string
  sessionId: string
  quizTitle: string
  bookTitle: string
  outcomeName: string
}

function buildShareMessage({
  quizTitle,
  bookTitle,
  outcomeName,
  url,
}: {
  quizTitle: string
  bookTitle: string
  outcomeName: string
  url: string
}) {
  return `I'm ${outcomeName}! Take the "${quizTitle}" quiz from ${bookTitle}.\n${url}`
}

export function QuizShareButton({
  quizId,
  sessionId,
  quizTitle,
  bookTitle,
  outcomeName,
}: QuizShareButtonProps) {
  const [copied, setCopied] = useState(false)

  function trackShare(platform: string) {
    trackEvent({
      event: "share",
      quizId,
      sessionId,
      platform,
    })
  }

  async function handleShare() {
    const url = window.location.href.split("?")[0]
    const text = `I'm ${outcomeName}! Take the "${quizTitle}" quiz from ${bookTitle}.`

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: quizTitle,
          text,
          url,
        })
        trackShare("native")
        return
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return
        }
      }
    }

    try {
      await navigator.clipboard.writeText(
        buildShareMessage({ quizTitle, bookTitle, outcomeName, url })
      )
      trackShare("copy")
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt("Copy this link to share your result:", url)
      trackShare("copy")
    }
  }

  return (
    <Button
      type="button"
      className="rounded-full"
      onClick={handleShare}
    >
      {copied ? (
        <Check data-icon="inline-start" />
      ) : (
        <Share2 data-icon="inline-start" />
      )}
      {copied ? "Copied!" : "Share result"}
    </Button>
  )
}

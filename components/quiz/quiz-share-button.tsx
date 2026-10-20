"use client"

import { useState } from "react"
import { Check, Share2 } from "lucide-react"

import { trackEvent } from "@/lib/analytics/client"
import { buildResultShareMessage, buildResultShareText } from "@/lib/quiz/share"
import { Button } from "@/components/ui/button"

type QuizShareButtonProps = {
  quizId: string
  sessionId: string
  quizTitle: string
  outcomeName: string
  outcomeTagline: string
  resultPath: string
}

export function QuizShareButton({
  quizId,
  sessionId,
  quizTitle,
  outcomeName,
  outcomeTagline,
  resultPath,
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
    const url = new URL(resultPath, window.location.origin).href
    const text = buildResultShareText({
      outcomeName,
      tagline: outcomeTagline,
      quizTitle,
    })

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
      await navigator.clipboard.writeText(buildResultShareMessage(text, url))
      trackShare("copy")
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt(
        "Copy this link to share your result:",
        buildResultShareMessage(text, url)
      )
      trackShare("copy")
    }
  }

  return (
    <Button type="button" className="rounded-full" onClick={handleShare}>
      {copied ? (
        <Check data-icon="inline-start" />
      ) : (
        <Share2 data-icon="inline-start" />
      )}
      {copied ? "Copied!" : "Share result"}
    </Button>
  )
}

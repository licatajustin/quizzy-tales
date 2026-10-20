import { ImageResponse } from "next/og"

import {
  buildOutcomeShareCard,
  buildQuizCollageCard,
  SHARE_IMAGE_SIZE,
} from "@/lib/quiz/share-image-card"

export function quizCollageImage(input: {
  quizTitle: string
  bookTitle: string
  portraitUrls: string[]
}) {
  return buildQuizCollageCard(input).then(
    (element) => new ImageResponse(element, { ...SHARE_IMAGE_SIZE })
  )
}

export function outcomeShareImage(input: {
  outcomeName: string
  tagline: string
  quizTitle: string
  bookTitle: string
  portraitUrl: string | null
}) {
  return buildOutcomeShareCard(input).then(
    (element) => new ImageResponse(element, { ...SHARE_IMAGE_SIZE })
  )
}

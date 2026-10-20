import { ImageResponse } from "next/og"
import type { ReactElement } from "react"

import {
  buildOutcomeShareCard,
  buildQuizCollageCard,
  SHARE_IMAGE_SIZE,
} from "@/lib/quiz/share-image-card"
import { normalizeQuizTheme, QUIZ_FONT_FAMILIES } from "@/lib/quiz/theme"

const fontBytes = new Map<string, ArrayBuffer>()

async function loadQuizHeadingFont(font: keyof typeof QUIZ_FONT_FAMILIES) {
  const family = QUIZ_FONT_FAMILIES[font]
  const cached = fontBytes.get(family)
  if (cached) {
    return { name: family, data: cached }
  }

  try {
    const cssResponse = await fetch(
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@600&display=swap`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
        },
        signal: AbortSignal.timeout(4000),
      }
    )
    if (!cssResponse.ok) {
      return null
    }

    const css = await cssResponse.text()
    const latin = css.split("/* latin */")[1] ?? css
    const match = latin.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/)
    if (!match) {
      return null
    }

    const fontResponse = await fetch(match[1], {
      signal: AbortSignal.timeout(4000),
    })
    if (!fontResponse.ok) {
      return null
    }

    const data = await fontResponse.arrayBuffer()
    fontBytes.set(family, data)
    return { name: family, data }
  } catch {
    return null
  }
}

async function renderShareImage(
  theme: unknown,
  build: (fontFamily: string | null) => Promise<ReactElement>
) {
  const requested = normalizeQuizTheme(theme).font
  const font = requested ? await loadQuizHeadingFont(requested) : null
  const element = await build(font?.name ?? null)

  return new ImageResponse(element, {
    ...SHARE_IMAGE_SIZE,
    fonts: font
      ? [{ name: font.name, data: font.data, weight: 600, style: "normal" }]
      : undefined,
  })
}

export function quizCollageImage(input: {
  quizTitle: string
  bookTitle: string
  portraitUrls: string[]
  theme?: unknown
}) {
  return renderShareImage(input.theme, (fontFamily) =>
    buildQuizCollageCard({ ...input, fontFamily })
  )
}

export function outcomeShareImage(input: {
  outcomeName: string
  tagline: string
  quizTitle: string
  bookTitle: string
  portraitUrl: string | null
  theme?: unknown
}) {
  return renderShareImage(input.theme, (fontFamily) =>
    buildOutcomeShareCard({ ...input, fontFamily })
  )
}

import { normalizeTagline } from "@/lib/quiz/outcome-details"
import type { PublishedOutcome, PublishedQuizSnapshot } from "@/lib/quiz/types"

export const COLLAGE_PORTRAIT_LIMIT = 5

const DATA_IMAGE_URL =
  /^data:image\/(?:png|jpe?g|gif|webp);base64,[a-z0-9+/=]+$/i

export function isShareImageUrl(url: string) {
  const value = url.trim()
  if (!value) {
    return false
  }

  if (value.startsWith("data:")) {
    return DATA_IMAGE_URL.test(value)
  }

  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    return false
  }

  if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
    return false
  }

  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "")
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host === "metadata.google.internal" ||
    isPrivateIpv4(host)
  ) {
    return false
  }

  return true
}

function isPrivateIpv4(host: string) {
  const match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (!match) {
    return false
  }

  const parts = match.slice(1).map(Number)
  if (parts.some((part) => part > 255)) {
    return false
  }

  const [a, b] = parts
  if (a === 10 || a === 127 || a === 0) {
    return true
  }
  if (a === 169 && b === 254) {
    return true
  }
  if (a === 192 && b === 168) {
    return true
  }
  if (a === 172 && b >= 16 && b <= 31) {
    return true
  }

  return false
}

export function collagePortraitUrls(
  outcomes: Pick<PublishedOutcome, "image_url" | "sort_order">[]
) {
  return [...outcomes]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((outcome) => outcome.image_url?.trim() ?? "")
    .filter((url) => isShareImageUrl(url))
    .slice(0, COLLAGE_PORTRAIT_LIMIT)
}

export function findPublishedOutcome(
  snapshot: PublishedQuizSnapshot,
  outcomeId: string
) {
  const id = outcomeId.trim()
  if (!id) {
    return null
  }

  return snapshot.outcomes.find((outcome) => outcome.id === id) ?? null
}

export function resultSharePath(slug: string, outcomeId: string) {
  return `/q/${encodeURIComponent(slug)}/r/${encodeURIComponent(outcomeId)}`
}

export function buildResultShareText(input: {
  outcomeName: string
  tagline?: string | null
  quizTitle: string
}) {
  const name = input.outcomeName.trim()
  const quizTitle = input.quizTitle.trim()
  const tagline = normalizeTagline(input.tagline)

  if (tagline) {
    return `I got ${name}, ${tagline}, in ${quizTitle}!`
  }

  return `I got ${name} in ${quizTitle}!`
}

export function buildResultShareMessage(text: string, url: string) {
  return `${text}\n${url}`
}

export function resultPageDescription(
  outcome: Pick<PublishedOutcome, "name" | "tagline" | "description">,
  snapshot: Pick<PublishedQuizSnapshot, "quiz_title">
) {
  const tagline = normalizeTagline(outcome.tagline)
  if (tagline) {
    return tagline
  }

  const description = outcome.description.trim()
  if (description) {
    return description
  }

  return `I got ${outcome.name.trim()} in ${snapshot.quiz_title.trim()}.`
}

export function clipShareText(value: string, max: number) {
  const trimmed = value.trim()
  if (trimmed.length <= max) {
    return trimmed
  }

  return `${trimmed.slice(0, max - 1).trimEnd()}…`
}

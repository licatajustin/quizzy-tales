import { generateObject } from "ai"

import { TEXT_MODEL } from "@/lib/ai/models"
import { buildBookResearchPrompt } from "@/lib/ai/prompts"
import { bookResearchSchema, type BookResearch } from "@/lib/ai/schemas"

export type BookResearchResult = {
  found: boolean
  title?: string
  authors?: string[]
  description?: string
  genre?: string
  themes?: string[]
  mainCharacters?: string[]
  summary: string
}

function hasUsefulResearch(
  research: BookResearch,
  synopsis?: string
) {
  if (synopsis && synopsis.trim().length >= 20) {
    return true
  }

  return Boolean(
    research.description?.trim() ||
      research.main_characters?.length ||
      research.themes?.length
  )
}

function formatResearchSummary(
  research: BookResearch,
  synopsis?: string
): BookResearchResult {
  const parts: string[] = []

  if (research.title) {
    parts.push(`Title: ${research.title}`)
  }
  if (research.authors?.length) {
    parts.push(`Authors: ${research.authors.join(", ")}`)
  }
  if (research.genre) {
    parts.push(`Genre: ${research.genre}`)
  }
  if (research.themes?.length) {
    parts.push(`Themes: ${research.themes.join(", ")}`)
  }
  if (research.main_characters?.length) {
    parts.push(`Main characters: ${research.main_characters.join(", ")}`)
  }
  if (research.description) {
    parts.push(`Description: ${research.description}`)
  }

  return {
    found: hasUsefulResearch(research, synopsis),
    title: research.title,
    authors: research.authors,
    description: research.description,
    genre: research.genre,
    themes: research.themes,
    mainCharacters: research.main_characters,
    summary: parts.join("\n"),
  }
}

export async function researchBook(input: {
  bookTitle: string
  authorName?: string
  synopsis?: string
}): Promise<BookResearchResult> {
  try {
    const { object } = await generateObject({
      model: TEXT_MODEL,
      schema: bookResearchSchema,
      prompt: buildBookResearchPrompt({
        bookTitle: input.bookTitle,
        authorName: input.authorName,
        synopsis: input.synopsis,
      }),
    })

    return formatResearchSummary(object, input.synopsis)
  } catch (error) {
    console.error("book research failed:", error)
    return {
      found: false,
      summary: "Book research unavailable — generation will rely on your synopsis.",
    }
  }
}

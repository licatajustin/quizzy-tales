export const INTRO_TEXT_MAX = 280

export function normalizeIntroText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.replace(/\s+/g, " ").trim().slice(0, INTRO_TEXT_MAX)
  return trimmed.length > 0 ? trimmed : null
}

export function quizPageDescription(snapshot: {
  intro_text?: string | null
  book_title: string
  quiz_title: string
}) {
  return (
    normalizeIntroText(snapshot.intro_text) ??
    `Which character from "${snapshot.book_title}" are you? Take the ${snapshot.quiz_title} quiz.`
  )
}

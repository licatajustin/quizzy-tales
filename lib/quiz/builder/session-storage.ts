import type { BuilderChatMessage, QuizBuilderDraft } from "@/lib/quiz/builder/types"
import { createEmptyBuilderDraft } from "@/lib/quiz/builder/types"
import { QUIZ_BUILDER_OPENING_MESSAGE } from "@/lib/quiz/builder/prompts"

const BUILDER_SESSION_KEY = "quizzy-tales:builder-session"

export type BuilderSession = {
  draft: QuizBuilderDraft
  messages: BuilderChatMessage[]
  savedAt: string
}

function createOpeningMessage(): BuilderChatMessage {
  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content: QUIZ_BUILDER_OPENING_MESSAGE,
  }
}

export function loadBuilderSession(): BuilderSession | null {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const raw = window.localStorage.getItem(BUILDER_SESSION_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as BuilderSession
    if (!parsed?.draft || !Array.isArray(parsed.messages)) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function saveBuilderSession(session: Omit<BuilderSession, "savedAt">) {
  if (typeof window === "undefined") {
    return
  }

  const payload: BuilderSession = {
    ...session,
    savedAt: new Date().toISOString(),
  }

  window.localStorage.setItem(BUILDER_SESSION_KEY, JSON.stringify(payload))
}

export function clearBuilderSession() {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.removeItem(BUILDER_SESSION_KEY)
}

export function createDefaultBuilderMessages() {
  return [createOpeningMessage()]
}

export function createRestoredBuilderState(session: BuilderSession | null) {
  if (!session) {
    return {
      draft: createEmptyBuilderDraft(),
      messages: createDefaultBuilderMessages(),
      restored: false,
    }
  }

  return {
    draft: session.draft,
    messages:
      session.messages.length > 0
        ? session.messages
        : createDefaultBuilderMessages(),
    restored: true,
  }
}

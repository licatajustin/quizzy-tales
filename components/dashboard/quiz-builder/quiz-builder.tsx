"use client"

import { Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowDown,
  ImagePlus,
  Loader2,
  Paperclip,
  Send,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"

import { saveQuizBuilderDraft } from "@/app/actions/ai"
import { QuizBreakdownPanel } from "@/components/dashboard/quiz-builder/quiz-breakdown-panel"
import { CheckoutReturnHandler } from "@/components/checkout/checkout-return-handler"
import { AiUpgradeDialog } from "@/components/subscription/ai-upgrade-dialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { showAiLimitToast } from "@/lib/ai/show-ai-limit-toast"
import { QUIZ_BUILDER_OPENING_MESSAGE } from "@/lib/quiz/builder/prompts"
import {
  clearBuilderSession,
  createRestoredBuilderState,
  loadBuilderSession,
  saveBuilderSession,
} from "@/lib/quiz/builder/session-storage"
import {
  createEmptyBuilderDraft,
  isBuilderDraftValid,
  type BuilderChatMessage,
  type QuizBuilderDraft,
} from "@/lib/quiz/builder/types"

function createMessageId() {
  return crypto.randomUUID()
}

type StreamDonePayload = {
  message: string
  suggestions: string[]
  draft: QuizBuilderDraft
}

async function readQuizBuilderChatStream(
  response: Response,
  onPartial: (message: string) => void
): Promise<StreamDonePayload> {
  if (!response.body) {
    throw new Error("No response body")
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  let donePayload: StreamDonePayload | null = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""

    for (const line of lines) {
      if (!line.trim()) {
        continue
      }

      const payload = JSON.parse(line) as {
        type: "partial" | "done" | "error"
        message?: string
        suggestions?: string[]
        draft?: QuizBuilderDraft
        error?: string
      }

      if (payload.type === "partial" && payload.message) {
        onPartial(payload.message)
      } else if (payload.type === "done") {
        if (!payload.message || !payload.draft) {
          throw new Error("Incomplete response")
        }
        donePayload = {
          message: payload.message,
          suggestions: payload.suggestions ?? [],
          draft: payload.draft,
        }
      } else if (payload.type === "error") {
        throw new Error(payload.error ?? "Stream failed")
      }
    }
  }

  if (!donePayload) {
    throw new Error("Incomplete response")
  }

  return donePayload
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const SCROLL_BOTTOM_THRESHOLD_PX = 48


export function QuizBuilder() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)
  const sessionReadyRef = useRef(false)
  const [showNewMessages, setShowNewMessages] = useState(false)
  const [draft, setDraft] = useState<QuizBuilderDraft>(createEmptyBuilderDraft())
  const [messages, setMessages] = useState<BuilderChatMessage[]>([
    {
      id: createMessageId(),
      role: "assistant",
      content: QUIZ_BUILDER_OPENING_MESSAGE,
    },
  ])
  const [input, setInput] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isSending, setIsSending] = useState(false)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null
  )
  const [isCreating, startCreate] = useTransition()
  const [upgradeSheetOpen, setUpgradeSheetOpen] = useState(false)
  const [attachTarget, setAttachTarget] = useState<
    "cover" | { outcomeId: string; outcomeName: string } | null
  >(null)

  const isValid = isBuilderDraftValid(draft)

  const openUpgradeSheet = useCallback(() => {
    saveBuilderSession({ draft, messages })
    setUpgradeSheetOpen(true)
  }, [draft, messages])

  useEffect(() => {
    const restored = createRestoredBuilderState(loadBuilderSession())
    setDraft(restored.draft)
    setMessages(restored.messages)

    if (restored.restored) {
      toast.message("Restored your saved quiz progress")
    }

    sessionReadyRef.current = true
  }, [])

  useEffect(() => {
    if (!sessionReadyRef.current) {
      return
    }

    saveBuilderSession({ draft, messages })
  }, [draft, messages])

  const checkIsAtBottom = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) {
      return true
    }

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight

    return distanceFromBottom <= SCROLL_BOTTOM_THRESHOLD_PX
  }, [])

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: "end" })
    isAtBottomRef.current = true
    setShowNewMessages(false)
  }, [])

  const handleScroll = useCallback(() => {
    const atBottom = checkIsAtBottom()
    isAtBottomRef.current = atBottom
    if (atBottom) {
      setShowNewMessages(false)
    }
  }, [checkIsAtBottom])

  useLayoutEffect(() => {
    if (isAtBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" })
    } else {
      setShowNewMessages(true)
    }
  }, [messages, suggestions])

  function sendMessage(text: string, draftForRequest?: QuizBuilderDraft) {
    const trimmed = text.trim()
    if (!trimmed || isSending) {
      return
    }

    const requestDraft = draftForRequest ?? draft

    const userMessage: BuilderChatMessage = {
      id: createMessageId(),
      role: "user",
      content: trimmed,
    }
    const assistantMessageId = createMessageId()

    const nextMessages = [
      ...messages,
      userMessage,
      {
        id: assistantMessageId,
        role: "assistant" as const,
        content: "",
      },
    ]

    setMessages(nextMessages)
    setInput("")
    setSuggestions([])
    setIsSending(true)
    setStreamingMessageId(assistantMessageId)
    isAtBottomRef.current = true
    setShowNewMessages(false)

    void (async () => {
      try {
        const response = await fetch("/api/quiz-builder/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMessage].map(({ role, content }) => ({
              role,
              content,
            })),
            draft: requestDraft,
          }),
        })

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string
          } | null

          if (
            payload?.error === "SUBSCRIPTION_REQUIRED" ||
            payload?.error === "AI_LIMIT_REACHED"
          ) {
            showAiLimitToast({
              description:
                "Your builder progress is saved. Start the author plan to unlock more AI.",
              onUpgrade: openUpgradeSheet,
            })
          } else {
            toast.error(payload?.error ?? "Could not send message.")
          }

          setMessages((current) =>
            current.filter((message) => message.id !== assistantMessageId)
          )
          return
        }

        const result = await readQuizBuilderChatStream(response, (message) => {
          setMessages((current) =>
            current.map((entry) =>
              entry.id === assistantMessageId
                ? { ...entry, content: message }
                : entry
            )
          )
        })

        setDraft(result.draft)
        setSuggestions(result.suggestions)
        setMessages((current) =>
          current.map((entry) =>
            entry.id === assistantMessageId
              ? { ...entry, content: result.message }
              : entry
          )
        )
      } catch {
        toast.error("Could not reach the assistant.")
        setMessages((current) =>
          current.filter((message) => message.id !== assistantMessageId)
        )
      } finally {
        setIsSending(false)
        setStreamingMessageId(null)
      }
    })()
  }

  function handleCreate() {
    if (!isValid) {
      return
    }

    startCreate(async () => {
      const result = await saveQuizBuilderDraft(draft)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      clearBuilderSession()
      router.refresh()
    })
  }

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) {
      return
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.")
      return
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image must be 8 MB or smaller.")
      return
    }

    try {
      const dataUrl = await readFileAsDataUrl(file)

      if (attachTarget === "cover") {
        setDraft((current) => {
          const nextDraft = { ...current, cover_image_url: dataUrl }
          sendMessage("I uploaded a cover image for the quiz.", nextDraft)
          return nextDraft
        })
      } else if (attachTarget && "outcomeId" in attachTarget) {
        setDraft((current) => {
          const nextDraft = {
            ...current,
            outcomes: current.outcomes.map((outcome) =>
              outcome.id === attachTarget.outcomeId
                ? { ...outcome, image_url: dataUrl }
                : outcome
            ),
          }
          sendMessage(
            `I uploaded a portrait photo for the "${attachTarget.outcomeName}" outcome.`,
            nextDraft
          )
          return nextDraft
        })
      } else if (draft.outcomes.length > 0) {
        const first = draft.outcomes[0]
        setDraft((current) => {
          const nextDraft = {
            ...current,
            outcomes: current.outcomes.map((outcome, index) =>
              index === 0 ? { ...outcome, image_url: dataUrl } : outcome
            ),
          }
          sendMessage(
            `I uploaded a portrait photo for the "${first.name || "first"}" outcome.`,
            nextDraft
          )
          return nextDraft
        })
      } else {
        setDraft((current) => {
          const nextDraft = { ...current, cover_image_url: dataUrl }
          sendMessage("I uploaded a cover image for the quiz.", nextDraft)
          return nextDraft
        })
      }
    } catch {
      toast.error("Could not read that image.")
    }

    setAttachTarget(null)
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[640px] flex-col gap-4">
      <Suspense fallback={null}>
        <CheckoutReturnHandler successMessage="Plan active. You can keep building with AI." />
      </Suspense>
      <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Create a quiz
          </h1>
          <p className="text-sm text-muted-foreground">
            Chat with your assistant — the breakdown updates as you go.
          </p>
        </div>
        <Button
          type="button"
          className="rounded-full"
          disabled={!isValid || isCreating}
          onClick={handleCreate}
        >
          {isCreating ? (
            <Loader2 className="animate-spin" data-icon="inline-start" />
          ) : (
            <Sparkles data-icon="inline-start" />
          )}
          {isCreating ? "Creating..." : "Create quiz"}
        </Button>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card className="flex min-h-0 flex-col overflow-hidden bg-card">
          <CardHeader className="shrink-0 border-b border-border/60 pb-4">
            <CardTitle className="text-base">Assistant</CardTitle>
            <CardDescription>
              Answer one question at a time — ask for ideas whenever you&apos;re
              stuck.
            </CardDescription>
          </CardHeader>

          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="relative min-h-0 flex-1 overflow-y-auto"
          >
            <CardContent className="space-y-4 p-4">
              {messages.map((message) => {
                const isStreamingMessage =
                  message.id === streamingMessageId && isSending

                return (
                  <div
                    key={message.id}
                    className={
                      message.role === "assistant"
                        ? "mr-8 rounded-2xl rounded-tl-sm bg-muted/50 px-4 py-3 text-sm"
                        : "ml-8 rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-sm text-primary-foreground"
                    }
                  >
                    {message.content ? (
                      <>
                        {message.content}
                        {isStreamingMessage ? (
                          <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-foreground/70 align-text-bottom" />
                        ) : null}
                      </>
                    ) : isStreamingMessage ? (
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="size-3 animate-spin" />
                      </span>
                    ) : null}
                  </div>
                )
              })}

              {suggestions.length > 0 && !isSending ? (
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => (
                    <Button
                      key={suggestion}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-auto rounded-full px-3 py-1.5 text-left text-xs whitespace-normal"
                      onClick={() => sendMessage(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              ) : null}

              <div ref={messagesEndRef} className="h-px shrink-0" aria-hidden />
            </CardContent>

            {showNewMessages ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full shadow-md"
                onClick={() => scrollToBottom("smooth")}
              >
                <ArrowDown data-icon="inline-start" />
                New messages
              </Button>
            ) : null}
          </div>

          <div className="shrink-0 space-y-3 border-t border-border/60 p-4">
            {draft.outcomes.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => {
                    setAttachTarget("cover")
                    fileInputRef.current?.click()
                  }}
                >
                  <ImagePlus data-icon="inline-start" />
                  Cover photo
                </Button>
                {draft.outcomes.map((outcome) => (
                  <Button
                    key={outcome.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => {
                      setAttachTarget({
                        outcomeId: outcome.id,
                        outcomeName: outcome.name || outcome.id,
                      })
                      fileInputRef.current?.click()
                    }}
                  >
                    <Paperclip data-icon="inline-start" />
                    {outcome.name.trim() || outcome.id}
                  </Button>
                ))}
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => {
                  setAttachTarget("cover")
                  fileInputRef.current?.click()
                }}
              >
                <ImagePlus data-icon="inline-start" />
                Attach image
              </Button>
            )}

            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault()
                sendMessage(input)
              }}
            >
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Type your answer..."
                rows={2}
                className="min-h-[52px] resize-none"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault()
                    sendMessage(input)
                  }
                }}
              />
              <Button
                type="submit"
                size="icon"
                className="shrink-0 rounded-full"
                disabled={!input.trim() || isSending}
                aria-label="Send message"
              >
                <Send className="size-4" />
              </Button>
            </form>
          </div>
        </Card>

        <QuizBreakdownPanel draft={draft} />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelect}
      />

      <AiUpgradeDialog
        open={upgradeSheetOpen}
        onOpenChange={setUpgradeSheetOpen}
        draft={draft}
        isDraftValid={isValid}
        progressSaved
      />
    </div>
  )
}

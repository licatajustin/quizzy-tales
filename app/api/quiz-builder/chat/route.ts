import { NextResponse } from "next/server"
import { streamObject } from "ai"

import { requireAiAccessForKind, recordAiUsageForKind } from "@/lib/ai/auth"
import { TEXT_MODEL } from "@/lib/ai/models"
import { buildQuizBuilderSystemPrompt } from "@/lib/quiz/builder/prompts"
import { getBuilderMissingFields } from "@/lib/quiz/builder/types"
import {
  draftToAiFormat,
  mergeBuilderDraftWithClientImages,
  quizBuilderChatRequestSchema,
  quizBuilderChatResponseSchema,
} from "@/lib/quiz/builder/schemas"

import { encodeNdjsonLine } from "@/lib/ai/ndjson"

export async function POST(request: Request) {
  const auth = await requireAiAccessForKind("builder-chat")

  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status }
    )
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const parsed = quizBuilderChatRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 }
    )
  }

  const { messages, draft: clientDraft } = parsed.data

  const conversation = messages
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n\n")

  try {
    const result = streamObject({
      model: TEXT_MODEL,
      schema: quizBuilderChatResponseSchema,
      system: buildQuizBuilderSystemPrompt(
        draftToAiFormat(clientDraft),
        getBuilderMissingFields(clientDraft)
      ),
      prompt: `Conversation so far:\n${conversation}\n\nRespond as the assistant for the latest user message.`,
    })

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        try {
          for await (const partial of result.partialObjectStream) {
            if (typeof partial.message === "string" && partial.message.length > 0) {
              controller.enqueue(
                encoder.encode(
                  encodeNdjsonLine({
                    type: "partial",
                    message: partial.message,
                  })
                )
              )
            }
          }

          const object = await result.object

          await recordAiUsageForKind(auth.userId, "builder-chat")

          controller.enqueue(
            encoder.encode(
              encodeNdjsonLine({
                type: "done",
                message: object.message,
                suggestions: object.suggestions,
                draft: mergeBuilderDraftWithClientImages(
                  clientDraft,
                  object.draft
                ),
              })
            )
          )
          controller.close()
        } catch (error) {
          console.error("quiz-builder chat stream failed:", error)
          controller.enqueue(
            encoder.encode(
              encodeNdjsonLine({
                type: "error",
                error: "Could not process your message. Please try again.",
              })
            )
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("quiz-builder chat failed:", error)
    return NextResponse.json(
      { error: "Could not process your message. Please try again." },
      { status: 500 }
    )
  }
}

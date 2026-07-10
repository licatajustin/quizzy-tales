import { NextResponse } from "next/server"
import { generateObject, streamObject } from "ai"

import { encodeNdjsonLine } from "@/lib/ai/ndjson"
import { researchBook } from "@/lib/ai/book-research"
import { requireAiAccessForKind, recordAiUsageForKind } from "@/lib/ai/auth"
import { TEXT_MODEL } from "@/lib/ai/models"
import { buildGenerateQuizPrompt } from "@/lib/ai/prompts"
import {
  generateQuizRequestSchema,
  generatedQuizSchema,
} from "@/lib/ai/schemas"

function hasPartialQuiz(partial: Record<string, unknown>) {
  return Boolean(
    partial.quiz_title ||
      (Array.isArray(partial.outcomes) && partial.outcomes.length > 0) ||
      (Array.isArray(partial.questions) && partial.questions.length > 0)
  )
}

export async function POST(request: Request) {
  const auth = await requireAiAccessForKind("generate-quiz")

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

  const parsed = generateQuizRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 }
    )
  }

  const input = parsed.data
  const characterCount = input.outcomes?.length ?? input.character_count

  const authorPromise = auth.supabase
    .from("authors")
    .select("display_name")
    .eq("id", auth.userId)
    .maybeSingle()

  if (input.stream) {
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        const send = (value: unknown) => {
          controller.enqueue(encoder.encode(encodeNdjsonLine(value)))
        }

        try {
          const [{ data: author }, bookResearchResult] = await Promise.all([
            authorPromise,
            input.run_book_research && !input.book_research
              ? (async () => {
                  send({
                    type: "status",
                    message: "Researching your book...",
                  })
                  return researchBook({
                    bookTitle: input.book_title,
                    authorName: input.author_name,
                    synopsis: input.synopsis,
                  })
                })()
              : Promise.resolve(null),
          ])

          const bookResearch =
            input.book_research ?? bookResearchResult?.summary

          if (bookResearchResult) {
            send({ type: "research", research: bookResearchResult })
          }

          send({ type: "status", message: "Drafting your quiz..." })

          const result = streamObject({
            model: TEXT_MODEL,
            schema: generatedQuizSchema,
            prompt: buildGenerateQuizPrompt({
              bookTitle: input.book_title,
              synopsis: input.synopsis,
              characterCount,
              quizTitle: input.quiz_title,
              authorName: input.author_name,
              authorDisplayName: author?.display_name,
              outcomes: input.outcomes,
              bookResearch,
              tone: input.tone,
              questionStyle: input.question_style,
              includeDescriptions: input.include_descriptions,
            }),
          })

          for await (const partial of result.partialObjectStream) {
            if (hasPartialQuiz(partial as Record<string, unknown>)) {
              send({ type: "partial", quiz: partial })
            }
          }

          const object = await result.object
          await recordAiUsageForKind(auth.userId, "generate-quiz")

          send({
            type: "done",
            quiz: object,
            research: bookResearchResult ?? undefined,
          })
          controller.close()
        } catch (error) {
          console.error("generate-quiz stream failed:", error)
          send({
            type: "error",
            error: "Could not generate quiz. Please try again.",
          })
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
  }

  const [{ data: author }, bookResearchResult] = await Promise.all([
    authorPromise,
    input.run_book_research && !input.book_research
      ? researchBook({
          bookTitle: input.book_title,
          authorName: input.author_name,
          synopsis: input.synopsis,
        })
      : Promise.resolve(null),
  ])

  const bookResearch = input.book_research ?? bookResearchResult?.summary

  try {
    const { object } = await generateObject({
      model: TEXT_MODEL,
      schema: generatedQuizSchema,
      prompt: buildGenerateQuizPrompt({
        bookTitle: input.book_title,
        synopsis: input.synopsis,
        characterCount,
        quizTitle: input.quiz_title,
        authorName: input.author_name,
        authorDisplayName: author?.display_name,
        outcomes: input.outcomes,
        bookResearch,
        tone: input.tone,
        questionStyle: input.question_style,
        includeDescriptions: input.include_descriptions,
      }),
    })

    await recordAiUsageForKind(auth.userId, "generate-quiz")

    return NextResponse.json({
      quiz: object,
      research: bookResearchResult ?? undefined,
    })
  } catch (error) {
    console.error("generate-quiz failed:", error)
    return NextResponse.json(
      { error: "Could not generate quiz. Please try again." },
      { status: 500 }
    )
  }
}

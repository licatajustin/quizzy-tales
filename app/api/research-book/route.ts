import { NextResponse } from "next/server"

import { researchBook } from "@/lib/ai/book-research"
import { requireAiAccessForKind } from "@/lib/ai/auth"
import { researchBookRequestSchema } from "@/lib/ai/schemas"

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

  const parsed = researchBookRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 }
    )
  }

  const research = await researchBook({
    bookTitle: parsed.data.book_title,
    authorName: parsed.data.author_name,
    synopsis: parsed.data.synopsis,
  })

  return NextResponse.json({ research })
}

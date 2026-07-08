import { NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { isPaidSubscriptionStatus } from "@/lib/subscription"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = createAdminClient()
  const now = new Date().toISOString()

  const { data: authors, error } = await admin
    .from("authors")
    .select("id, subscription_status, subscription_grace_ends_at")
    .not("subscription_grace_ends_at", "is", null)
    .lt("subscription_grace_ends_at", now)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let unpublished = 0

  for (const author of authors ?? []) {
    if (isPaidSubscriptionStatus(author.subscription_status)) {
      await admin
        .from("authors")
        .update({ subscription_grace_ends_at: null })
        .eq("id", author.id)
      continue
    }

    const { data: quizzes } = await admin
      .from("quizzes")
      .select("id, slug")
      .eq("author_id", author.id)
      .eq("status", "published")

    if (!quizzes?.length) {
      await admin
        .from("authors")
        .update({ subscription_grace_ends_at: null })
        .eq("id", author.id)
      continue
    }

    await admin
      .from("quizzes")
      .update({ status: "draft" })
      .eq("author_id", author.id)
      .eq("status", "published")

    await admin
      .from("authors")
      .update({ subscription_grace_ends_at: null })
      .eq("id", author.id)

    unpublished += quizzes.length
  }

  return NextResponse.json({
    processed: authors?.length ?? 0,
    unpublished,
  })
}

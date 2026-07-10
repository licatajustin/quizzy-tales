import Link from "next/link"
import { redirect } from "next/navigation"

import { GuidedQuizCreator } from "@/components/dashboard/guided-quiz-creator"
import { Button } from "@/components/ui/button"
import { getSubscriptionAccessForUser } from "@/lib/subscription-server"
import { createClient } from "@/lib/supabase/server"

export default async function GuidedNewQuizPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const [{ data: author }, access] = await Promise.all([
    supabase
      .from("authors")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle(),
    getSubscriptionAccessForUser(supabase, user.id),
  ])

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Start from your book
          </h1>
          <p className="mt-2 text-muted-foreground">
            We&apos;ll research your book, draft a full quiz, and let you
            review before saving.
          </p>
        </div>
        <Button asChild variant="ghost" size="sm" className="rounded-full">
          <Link href="/dashboard/quizzes/new">Choose another path</Link>
        </Button>
      </div>
      <GuidedQuizCreator
        canUseAI={access?.canUseAI ?? false}
        defaultAuthorName={author?.display_name ?? ""}
      />
    </div>
  )
}

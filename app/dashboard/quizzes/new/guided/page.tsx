import Link from "next/link"
import dynamic from "next/dynamic"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getDashboardSession } from "@/lib/auth/dashboard-session"
import { getSubscriptionAccessForUser } from "@/lib/subscription-server"

const GuidedQuizCreator = dynamic(
  () =>
    import("@/components/dashboard/guided-quiz-creator").then(
      (module) => module.GuidedQuizCreator
    ),
  {
    loading: () => (
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    ),
  }
)

export default async function GuidedNewQuizPage() {
  const { supabase, user } = await getDashboardSession()

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

import Link from "next/link"
import { redirect } from "next/navigation"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { QuizList } from "@/components/dashboard/quiz-list"
import { createClient } from "@/lib/supabase/server"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const [{ data: author }, { data: quizzes }] = await Promise.all([
    supabase
      .from("authors")
      .select("display_name, onboarding_completed")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("quizzes")
      .select("*")
      .eq("author_id", user.id)
      .order("updated_at", { ascending: false }),
  ])

  const publishedCount =
    quizzes?.filter((quiz) => quiz.status === "published").length ?? 0

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Welcome{author?.display_name ? `, ${author.display_name}` : ""}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Build book-themed personality quizzes your readers will share.
          </p>
        </div>
        <Button asChild className="rounded-full">
          <Link href="/dashboard/quizzes/new">
            <Plus data-icon="inline-start" />
            New quiz
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total quizzes" value={quizzes?.length ?? 0} />
        <StatCard label="Published" value={publishedCount} />
        <StatCard
          label="Drafts"
          value={(quizzes?.length ?? 0) - publishedCount}
        />
      </div>

      {!author?.onboarding_completed ? (
        <div className="rounded-xl border border-border/60 bg-card p-4 text-sm">
          <p className="font-medium">Finish onboarding when you&apos;re ready</p>
          <p className="mt-1 text-muted-foreground">
            You can skip it and create quizzes manually in the meantime.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-3 rounded-full">
            <Link href="/dashboard/onboarding">Open onboarding</Link>
          </Button>
        </div>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Your quizzes</h2>
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link href="/dashboard/quizzes">View all</Link>
          </Button>
        </div>
        <QuizList quizzes={quizzes ?? []} />
      </section>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  )
}

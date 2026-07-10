import Link from "next/link"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { QuizList } from "@/components/dashboard/quiz-list"
import { getDashboardSession } from "@/lib/auth/dashboard-session"
import { QUIZ_LIST_SELECT } from "@/lib/quiz/types"

export default async function QuizzesPage() {
  const { supabase, user } = await getDashboardSession()

  const { data: quizzes } = await supabase
    .from("quizzes")
    .select(QUIZ_LIST_SELECT)
    .eq("author_id", user.id)
    .order("updated_at", { ascending: false })

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Quizzes</h1>
          <p className="mt-2 text-muted-foreground">
            Manage drafts and published quizzes.
          </p>
        </div>
        <Button asChild className="rounded-full">
          <Link href="/dashboard/quizzes/new">
            <Plus data-icon="inline-start" />
            New quiz
          </Link>
        </Button>
      </div>

      <QuizList quizzes={quizzes ?? []} />
    </div>
  )
}

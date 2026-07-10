import Link from "next/link"

import { NewQuizForm } from "@/components/dashboard/new-quiz-form"
import { Button } from "@/components/ui/button"
import { getDashboardSession } from "@/lib/auth/dashboard-session"

export default async function ManualNewQuizPage() {
  await getDashboardSession()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">New quiz</h1>
          <p className="mt-2 text-muted-foreground">
            Enter book and quiz details, then build in the editor.
          </p>
        </div>
        <Button asChild variant="ghost" size="sm" className="rounded-full">
          <Link href="/dashboard/quizzes/new">Choose another path</Link>
        </Button>
      </div>
      <NewQuizForm />
    </div>
  )
}

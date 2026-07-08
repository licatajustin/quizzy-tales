import Link from "next/link"
import { redirect } from "next/navigation"

import { QuizBuilder } from "@/components/dashboard/quiz-builder/quiz-builder"
import { NewQuizForm } from "@/components/dashboard/new-quiz-form"
import { Button } from "@/components/ui/button"
import { getSubscriptionAccessForUser } from "@/lib/subscription-server"
import { createClient } from "@/lib/supabase/server"

export default async function NewQuizPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const access = await getSubscriptionAccessForUser(supabase, user.id)

  if (!access?.canUseAI) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">New quiz</h1>
          <p className="mt-2 text-muted-foreground">
            Your AI trial is used up. Start the author plan to unlock full AI, or
            create manually.
          </p>
        </div>
        <NewQuizForm />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="mb-4 flex justify-end">
        <Button asChild variant="ghost" size="sm" className="rounded-full">
          <Link href="/dashboard/quizzes/new/manual">
            Create manually instead
          </Link>
        </Button>
      </div>
      <QuizBuilder />
    </div>
  )
}

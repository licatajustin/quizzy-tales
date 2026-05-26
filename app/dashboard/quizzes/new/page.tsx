import { redirect } from "next/navigation"

import { NewQuizForm } from "@/components/dashboard/new-quiz-form"
import { UpgradePrompt } from "@/components/subscription/upgrade-prompt"
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

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">New quiz</h1>
        <p className="mt-2 text-muted-foreground">
          Enter your book details to create a draft quiz.
        </p>
      </div>

      {access && !access.canCreateQuiz ? (
        <UpgradePrompt
          title="You’ve reached the free quiz limit"
          description="Free accounts include one quiz. Upgrade to Pro to create unlimited quizzes and publish them for readers."
        />
      ) : (
        <NewQuizForm />
      )}
    </div>
  )
}

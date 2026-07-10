import Link from "next/link"
import { redirect } from "next/navigation"

import { QuizBuilder } from "@/components/dashboard/quiz-builder/quiz-builder"
import { Button } from "@/components/ui/button"
import { getSubscriptionAccessForUser } from "@/lib/subscription-server"
import { createClient } from "@/lib/supabase/server"

export default async function ConversationalAiQuizPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const access = await getSubscriptionAccessForUser(supabase, user.id)

  if (!access?.canUseAI) {
    redirect("/dashboard/quizzes/new")
  }

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="mb-4 flex justify-end">
        <Button asChild variant="ghost" size="sm" className="rounded-full">
          <Link href="/dashboard/quizzes/new">Choose another path</Link>
        </Button>
      </div>
      <QuizBuilder />
    </div>
  )
}

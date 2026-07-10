import { redirect } from "next/navigation"

import { QuizCreationPathSelector } from "@/components/dashboard/quiz-creation-path-selector"
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
    <QuizCreationPathSelector canUseAI={access?.canUseAI ?? false} />
  )
}

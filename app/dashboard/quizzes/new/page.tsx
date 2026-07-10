import { QuizCreationPathSelector } from "@/components/dashboard/quiz-creation-path-selector"
import { getDashboardSession } from "@/lib/auth/dashboard-session"
import { getSubscriptionAccessForUser } from "@/lib/subscription-server"

export default async function NewQuizPage() {
  const { supabase, user } = await getDashboardSession()
  const access = await getSubscriptionAccessForUser(supabase, user.id)

  return (
    <QuizCreationPathSelector canUseAI={access?.canUseAI ?? false} />
  )
}

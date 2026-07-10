import Link from "next/link"
import dynamic from "next/dynamic"
import { redirect } from "next/navigation"

import { Button } from "@/components/ui/button"
import { CheckoutSyncedToast } from "@/components/checkout/checkout-synced-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { getDashboardSession } from "@/lib/auth/dashboard-session"
import { syncCheckoutReturnIfNeeded } from "@/lib/billing/checkout-return"
import { getSubscriptionAccessForUser } from "@/lib/subscription-server"

const QuizBuilder = dynamic(
  () =>
    import("@/components/dashboard/quiz-builder/quiz-builder").then(
      (module) => module.QuizBuilder
    ),
  {
    loading: () => <Skeleton className="h-[32rem] w-full rounded-xl" />,
  }
)

export default async function ConversationalAiQuizPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string; session_id?: string }>
}) {
  const query = await searchParams
  const { supabase, user } = await getDashboardSession()

  await syncCheckoutReturnIfNeeded(
    user.id,
    query,
    "/dashboard/quizzes/new/ai"
  )
  const access = await getSubscriptionAccessForUser(supabase, user.id)

  if (!access?.canUseAI) {
    redirect("/dashboard/quizzes/new")
  }

  return (
    <div className="mx-auto w-full max-w-7xl">
      <CheckoutSyncedToast message="Plan active. You can keep building your quiz." />
      <div className="mb-4 flex justify-end">
        <Button asChild variant="ghost" size="sm" className="rounded-full">
          <Link href="/dashboard/quizzes/new">Choose another path</Link>
        </Button>
      </div>
      <QuizBuilder />
    </div>
  )
}

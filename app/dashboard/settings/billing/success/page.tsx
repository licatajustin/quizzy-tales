import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type BillingSuccessPageProps = {
  searchParams: Promise<{ session_id?: string }>
}

export default async function BillingSuccessPage({
  searchParams,
}: BillingSuccessPageProps) {
  const { session_id: sessionId } = await searchParams

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8">
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Welcome to Pro</CardTitle>
          <CardDescription>
            Your subscription is being activated. It may take a few seconds for
            publishing and AI features to unlock.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessionId ? (
            <p className="text-xs text-muted-foreground">
              Reference: {sessionId}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <Button asChild className="rounded-full">
              <Link href="/dashboard/quizzes">Go to quizzes</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/dashboard/settings/billing">View billing</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

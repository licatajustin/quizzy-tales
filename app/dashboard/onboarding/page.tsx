import Link from "next/link"
import { redirect } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

export default async function OnboardingPlaceholderPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  async function skipOnboarding() {
    "use server"

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect("/auth/login")
    }

    await supabase
      .from("authors")
      .update({ onboarding_completed: true })
      .eq("id", user.id)

    redirect("/dashboard")
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Onboarding</CardTitle>
          <CardDescription>
            The full onboarding wizard arrives in a later phase. For now you can
            skip and explore the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <form action={skipOnboarding}>
            <Button type="submit" className="rounded-full">
              Skip for now
            </Button>
          </form>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

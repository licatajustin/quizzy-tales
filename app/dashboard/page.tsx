import Link from "next/link"
import { redirect } from "next/navigation"

import { signOut } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: author } = await supabase
    .from("authors")
    .select("display_name, onboarding_completed")
    .eq("id", user.id)
    .maybeSingle()

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Welcome{author?.display_name ? `, ${author.display_name}` : ""}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Your author dashboard is ready. Quiz creation comes next.
          </p>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="outline" className="rounded-full">
            Sign out
          </Button>
        </form>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting started</CardTitle>
          <CardDescription>
            Phase 1 foundation is in place — auth, database schema, and route
            protection.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>Signed in as {user.email}</p>
          <p>
            Onboarding status:{" "}
            {author?.onboarding_completed ? "Complete" : "Not started"}
          </p>
          {!author?.onboarding_completed ? (
            <Button asChild className="rounded-full">
              <Link href="/dashboard/onboarding">Start onboarding</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

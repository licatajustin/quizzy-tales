import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-svh bg-background">
      <div className="border-b border-border/60">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-6">
          <p className="text-sm font-medium">QuizzyTales Dashboard</p>
        </div>
      </div>
      {children}
    </div>
  )
}

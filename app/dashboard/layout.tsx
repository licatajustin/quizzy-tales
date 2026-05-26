import { redirect } from "next/navigation"

import { DashboardChrome } from "@/components/dashboard/dashboard-chrome"
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

  const { data: author } = await supabase
    .from("authors")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle()

  return (
    <DashboardChrome
      user={{
        name: author?.display_name ?? "Author",
        email: user.email ?? "",
      }}
    >
      {children}
    </DashboardChrome>
  )
}

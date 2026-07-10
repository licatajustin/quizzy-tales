import type { Metadata } from "next"

import { getDashboardSession } from "@/lib/auth/dashboard-session"
import { DashboardChrome } from "@/components/dashboard/dashboard-chrome"

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { supabase, user } = await getDashboardSession()

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

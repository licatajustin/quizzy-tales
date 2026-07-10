import type { Metadata } from "next"

import { DashboardChrome } from "@/components/dashboard/dashboard-chrome"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { getAuthorDisplayName } from "@/lib/auth/author"
import { getDashboardSession } from "@/lib/auth/dashboard-session"

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
  const displayName = await getAuthorDisplayName(supabase, user.id)

  return (
    <TooltipProvider>
      <DashboardChrome
        user={{
          name: displayName ?? "Author",
          email: user.email ?? "",
        }}
      >
        {children}
      </DashboardChrome>
      <Toaster />
    </TooltipProvider>
  )
}

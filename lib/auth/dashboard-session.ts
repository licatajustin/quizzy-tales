import type { SupabaseClient, User } from "@supabase/supabase-js"
import { cache } from "react"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

export const getDashboardSession = cache(async (): Promise<{
  supabase: SupabaseClient
  user: User
}> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return { supabase, user }
})

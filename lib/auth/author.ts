import type { SupabaseClient } from "@supabase/supabase-js"
import { cache } from "react"

export const getAuthorDisplayName = cache(
  async (supabase: SupabaseClient, userId: string) => {
    const { data } = await supabase
      .from("authors")
      .select("display_name")
      .eq("id", userId)
      .maybeSingle()

    return data?.display_name ?? null
  }
)

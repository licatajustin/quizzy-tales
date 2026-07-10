import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { unstable_cache } from "next/cache"
import { cache } from "react"

import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env"
import { getPublishedQuizBySlug } from "@/lib/quiz/queries"

async function fetchPublishedQuiz(slug: string) {
  const supabase = createSupabaseClient(getSupabaseUrl(), getSupabaseAnonKey())
  return getPublishedQuizBySlug(supabase, slug)
}

function getCachedPublishedQuizBySlug(slug: string) {
  return unstable_cache(
    () => fetchPublishedQuiz(slug),
    ["published-quiz", slug],
    { revalidate: 3600, tags: [`quiz-${slug}`] }
  )()
}

export const getPublicQuizBySlug = cache((slug: string) =>
  getCachedPublishedQuizBySlug(slug)
)

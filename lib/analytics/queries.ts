import type { SupabaseClient } from "@supabase/supabase-js"

import type { QuizAnalyticsSummary } from "@/lib/analytics/types"
import type { PublishedQuizSnapshot } from "@/lib/quiz/types"

const DAYS = 30

function formatDayLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

function buildDailyActivity(
  starts: { created_at: string }[],
  completions: { created_at: string }[]
) {
  const today = new Date()
  const days: QuizAnalyticsSummary["dailyActivity"] = []

  for (let index = DAYS - 1; index >= 0; index -= 1) {
    const day = new Date(today)
    day.setDate(today.getDate() - index)
    const date = day.toISOString().slice(0, 10)

    days.push({
      date,
      label: formatDayLabel(date),
      starts: starts.filter((row) => row.created_at.startsWith(date)).length,
      completions: completions.filter((row) => row.created_at.startsWith(date))
        .length,
    })
  }

  return days
}

export async function getAuthorQuizIds(
  supabase: SupabaseClient,
  authorId: string
) {
  const { data } = await supabase
    .from("quizzes")
    .select("id, quiz_title, book_title, status, published_snapshot")
    .eq("author_id", authorId)
    .order("updated_at", { ascending: false })

  return data ?? []
}

export async function getQuizAnalyticsSummary(
  supabase: SupabaseClient,
  quizIds: string[],
  outcomeNames: Map<string, string>
): Promise<QuizAnalyticsSummary> {
  if (quizIds.length === 0) {
    return {
      views: 0,
      starts: 0,
      completions: 0,
      shares: 0,
      completionRate: 0,
      outcomeCounts: [],
      dailyActivity: buildDailyActivity([], []),
    }
  }

  const since = new Date()
  since.setDate(since.getDate() - (DAYS - 1))
  since.setHours(0, 0, 0, 0)

  const { data: events } = await supabase
    .from("quiz_events")
    .select("event_type, outcome_id, created_at")
    .in("quiz_id", quizIds)
    .gte("created_at", since.toISOString())

  const rows = events ?? []
  const views = rows.filter((row) => row.event_type === "view").length
  const starts = rows.filter((row) => row.event_type === "start")
  const completions = rows.filter((row) => row.event_type === "complete")
  const shares = rows.filter((row) => row.event_type === "share").length

  const outcomeMap = new Map<string, number>()
  for (const row of completions) {
    if (!row.outcome_id) continue
    outcomeMap.set(row.outcome_id, (outcomeMap.get(row.outcome_id) ?? 0) + 1)
  }

  const outcomeCounts = [...outcomeMap.entries()]
    .map(([outcomeId, count]) => ({
      outcomeId,
      name: outcomeNames.get(outcomeId) ?? "Unknown outcome",
      count,
    }))
    .sort((a, b) => b.count - a.count)

  return {
    views,
    starts: starts.length,
    completions: completions.length,
    shares,
    completionRate:
      starts.length > 0
        ? Math.round((completions.length / starts.length) * 100)
        : 0,
    outcomeCounts,
    dailyActivity: buildDailyActivity(starts, completions),
  }
}

export function outcomeNamesFromSnapshots(
  quizzes: {
    id: string
    published_snapshot: PublishedQuizSnapshot | null
  }[]
) {
  const names = new Map<string, string>()

  for (const quiz of quizzes) {
    const snapshot = quiz.published_snapshot
    if (!snapshot) continue

    for (const outcome of snapshot.outcomes) {
      names.set(outcome.id, outcome.name)
    }
  }

  return names
}

export function outcomeNamesForQuiz(
  snapshot: PublishedQuizSnapshot | null
): Map<string, string> {
  const names = new Map<string, string>()
  if (!snapshot) return names

  for (const outcome of snapshot.outcomes) {
    names.set(outcome.id, outcome.name)
  }

  return names
}

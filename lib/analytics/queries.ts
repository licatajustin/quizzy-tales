import type { SupabaseClient } from "@supabase/supabase-js"

import type { QuizAnalyticsSummary } from "@/lib/analytics/types"
import type { PublishedQuizSnapshot } from "@/lib/quiz/types"

const DAYS = 30
const EVENT_PAGE_SIZE = 1000

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function toDateKeyFromTimestamp(timestamp: string) {
  return toDateKey(new Date(timestamp))
}

function formatDayLabel(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number)
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

type DailyCounts = {
  views: number
  starts: number
  completions: number
}

function buildDailyActivity(
  events: { event_type: string; created_at: string }[]
) {
  const countsByDate = new Map<string, DailyCounts>()

  for (const row of events) {
    const date = toDateKeyFromTimestamp(row.created_at)
    const counts = countsByDate.get(date) ?? {
      views: 0,
      starts: 0,
      completions: 0,
    }

    if (row.event_type === "view") {
      counts.views += 1
    } else if (row.event_type === "start") {
      counts.starts += 1
    } else if (row.event_type === "complete") {
      counts.completions += 1
    }

    countsByDate.set(date, counts)
  }

  const today = startOfDay(new Date())
  const days: QuizAnalyticsSummary["dailyActivity"] = []

  for (let index = DAYS - 1; index >= 0; index -= 1) {
    const day = new Date(today)
    day.setDate(today.getDate() - index)
    const date = toDateKey(day)
    const counts = countsByDate.get(date) ?? {
      views: 0,
      starts: 0,
      completions: 0,
    }

    days.push({
      date,
      label: formatDayLabel(date),
      views: counts.views,
      starts: counts.starts,
      completions: counts.completions,
    })
  }

  return days
}

async function fetchQuizEvents(
  supabase: SupabaseClient,
  quizIds: string[],
  since: Date
) {
  const rows: { event_type: string; outcome_id: string | null; created_at: string }[] =
    []
  let offset = 0

  while (true) {
    const { data, error } = await supabase
      .from("quiz_events")
      .select("event_type, outcome_id, created_at")
      .in("quiz_id", quizIds)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: true })
      .range(offset, offset + EVENT_PAGE_SIZE - 1)

    if (error) {
      throw error
    }

    if (!data?.length) {
      break
    }

    rows.push(...data)

    if (data.length < EVENT_PAGE_SIZE) {
      break
    }

    offset += EVENT_PAGE_SIZE
  }

  return rows
}

export async function getAuthorQuizList(
  supabase: SupabaseClient,
  authorId: string
) {
  const { data } = await supabase
    .from("quizzes")
    .select("id, quiz_title, book_title, status")
    .eq("author_id", authorId)
    .order("updated_at", { ascending: false })

  return data ?? []
}

export async function getPublishedQuizSnapshots(
  supabase: SupabaseClient,
  authorId: string,
  quizIds: string[]
) {
  if (quizIds.length === 0) {
    return []
  }

  const { data } = await supabase
    .from("quizzes")
    .select("id, published_snapshot")
    .eq("author_id", authorId)
    .in("id", quizIds)

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
      dailyActivity: buildDailyActivity([]),
    }
  }

  const since = startOfDay(new Date())
  since.setDate(since.getDate() - (DAYS - 1))

  const rows = await fetchQuizEvents(supabase, quizIds, since)

  let views = 0
  let starts = 0
  let completions = 0
  let shares = 0
  const outcomeMap = new Map<string, number>()

  for (const row of rows) {
    switch (row.event_type) {
      case "view":
        views += 1
        break
      case "start":
        starts += 1
        break
      case "complete":
        completions += 1
        if (row.outcome_id) {
          outcomeMap.set(
            row.outcome_id,
            (outcomeMap.get(row.outcome_id) ?? 0) + 1
          )
        }
        break
      case "share":
        shares += 1
        break
    }
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
    starts,
    completions,
    shares,
    completionRate:
      starts > 0 ? Math.round((completions / starts) * 100) : 0,
    outcomeCounts,
    dailyActivity: buildDailyActivity(rows),
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

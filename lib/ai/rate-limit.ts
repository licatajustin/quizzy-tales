const DAILY_IMAGE_LIMIT = 12

type UsageEntry = {
  date: string
  count: number
}

const imageUsageByUser = new Map<string, UsageEntry>()

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export function checkImageRateLimit(userId: string) {
  const today = todayKey()
  const entry = imageUsageByUser.get(userId)

  if (!entry || entry.date !== today) {
    return { allowed: true, remaining: DAILY_IMAGE_LIMIT }
  }

  const remaining = Math.max(0, DAILY_IMAGE_LIMIT - entry.count)
  return { allowed: remaining > 0, remaining }
}

export function recordImageGeneration(userId: string) {
  const today = todayKey()
  const entry = imageUsageByUser.get(userId)

  if (!entry || entry.date !== today) {
    imageUsageByUser.set(userId, { date: today, count: 1 })
    return
  }

  entry.count += 1
}

export function getDailyImageLimit() {
  return DAILY_IMAGE_LIMIT
}

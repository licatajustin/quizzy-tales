import type { TrackPayload } from "@/lib/analytics/types"

const ANON_ID_KEY = "quizzy_anon_id"

export function getAnonymousId(): string {
  if (typeof window === "undefined") {
    return "server"
  }

  const existing = localStorage.getItem(ANON_ID_KEY)
  if (existing) {
    return existing
  }

  const id = crypto.randomUUID()
  localStorage.setItem(ANON_ID_KEY, id)
  return id
}

export function getDeviceType(): string {
  if (typeof window === "undefined") {
    return "unknown"
  }

  const width = window.innerWidth
  if (width < 768) return "mobile"
  if (width < 1024) return "tablet"
  return "desktop"
}

export function getTrackingContext() {
  if (typeof window === "undefined") {
    return {}
  }

  const params = new URLSearchParams(window.location.search)

  return {
    referrer: document.referrer || undefined,
    utm_source: params.get("utm_source") ?? undefined,
    utm_medium: params.get("utm_medium") ?? undefined,
    utm_campaign: params.get("utm_campaign") ?? undefined,
    deviceType: getDeviceType(),
  }
}

export function trackEvent(payload: TrackPayload) {
  if (typeof window === "undefined") {
    return
  }

  void fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // Fire-and-forget analytics — ignore network errors.
  })
}

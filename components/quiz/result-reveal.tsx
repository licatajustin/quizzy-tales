"use client"

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react"

import {
  RESULT_REVEAL_MS,
  shouldSkipResultReveal,
} from "@/lib/quiz/result-reveal"

function subscribeReducedMotion(onStoreChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)")
  media.addEventListener("change", onStoreChange)
  return () => media.removeEventListener("change", onStoreChange)
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  )
}

export function ResultReveal({
  skip = false,
  children,
}: {
  /** Skip the interstitial when a finished result was restored. */
  skip?: boolean
  children: ReactNode
}) {
  const reduceMotion = usePrefersReducedMotion()
  const skipReveal = shouldSkipResultReveal({
    reduceMotion,
    restoredFinishedResult: skip,
  })
  const [timerDone, setTimerDone] = useState(false)
  const revealed = skipReveal || timerDone

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" })
  }, [])

  useEffect(() => {
    if (skipReveal) {
      return
    }

    const timeout = window.setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" })
      setTimerDone(true)
    }, RESULT_REVEAL_MS)

    return () => window.clearTimeout(timeout)
  }, [skipReveal])

  if (!revealed) {
    return (
      <div
        className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col items-center justify-center gap-4 px-6 py-12"
        role="status"
        aria-live="polite"
        data-slot="quiz-result-reveal"
      >
        <span
          aria-hidden
          className="size-2 rounded-full bg-primary motion-safe:animate-pulse"
        />
        <p className="text-sm font-medium tracking-wide text-muted-foreground">
          Revealing your result…
        </p>
      </div>
    )
  }

  return (
    <div
      className={
        reduceMotion
          ? undefined
          : "motion-safe:animate-in motion-safe:duration-300 motion-safe:fade-in-0"
      }
    >
      {children}
    </div>
  )
}

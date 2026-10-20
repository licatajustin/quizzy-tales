export const RESULT_REVEAL_MS = 700

export function shouldSkipResultReveal(options: {
  reduceMotion: boolean
  restoredFinishedResult: boolean
}) {
  return options.reduceMotion || options.restoredFinishedResult
}

export function isRestoredFinishedResult(options: {
  subsetActive: boolean
  restoredState: "intro" | "playing" | "result" | null
  hasSessionOverride: boolean
}) {
  return (
    options.subsetActive &&
    options.restoredState === "result" &&
    !options.hasSessionOverride
  )
}

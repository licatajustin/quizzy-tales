import { readHttpUrl } from "@/lib/quiz/reader-links"

export const QUIZ_BACKGROUND_PRESETS = [
  "light",
  "dark",
  "parchment",
  "night",
] as const

export const QUIZ_BACKGROUND_COLORS = {
  light: "#ffffff",
  dark: "#171513",
  parchment: "#f3ead7",
  night: "#141824",
} as const

export const QUIZ_HEADING_FONTS = ["serif", "story", "modern"] as const

export const QUIZ_FONT_FAMILIES = {
  serif: "Fraunces",
  story: "Cinzel",
  modern: "Outfit",
} as const

const HEX_COLOR = /^#([0-9a-f]{6})$/i
const DATA_IMAGE_URL =
  /^data:image\/(?:png|jpe?g|gif|webp|svg\+xml)(?:;charset=[^;,]+)?[;,]/i
const ROOT_PATH = /^\/(?!\/)[A-Za-z0-9._~:/?#[\]@!$&'()*+,;=%-]*$/
const LOGO_URL_MAX = 2000

export type QuizBackgroundPreset = (typeof QUIZ_BACKGROUND_PRESETS)[number]
export type QuizBackgroundStyle = QuizBackgroundPreset | "custom"
export type QuizHeadingFont = (typeof QUIZ_HEADING_FONTS)[number]
export type QuizCornerStyle = "rounded" | "sharp"

export type QuizTheme = {
  accent: string | null
  background: QuizBackgroundStyle | null
  background_color: string | null
  font: QuizHeadingFont | null
  corners: QuizCornerStyle | null
  logo_url: string | null
}

export const EMPTY_QUIZ_THEME: QuizTheme = {
  accent: null,
  background: null,
  background_color: null,
  font: null,
  corners: null,
  logo_url: null,
}

export function isPlainObject(
  value: unknown
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function normalizeHexColor(value: unknown): string | null {
  if (typeof value !== "string") {
    return null
  }

  const match = HEX_COLOR.exec(value.trim())
  if (!match) {
    return null
  }

  return `#${match[1].toLowerCase()}`
}

function normalizeBackground(value: unknown): QuizBackgroundStyle | null {
  if (typeof value !== "string") {
    return null
  }

  const background = value.trim().toLowerCase()
  if (
    background === "light" ||
    background === "dark" ||
    background === "parchment" ||
    background === "night" ||
    background === "custom"
  ) {
    return background
  }

  return null
}

function normalizeFont(value: unknown): QuizHeadingFont | null {
  if (typeof value !== "string") {
    return null
  }

  const font = value.trim().toLowerCase()
  if (font === "default" || font === "") {
    return null
  }

  if (font === "serif" || font === "story" || font === "modern") {
    return font
  }

  return null
}

function normalizeCorners(value: unknown): QuizCornerStyle | null {
  if (typeof value !== "string") {
    return null
  }

  const corners = value.trim().toLowerCase()
  if (corners === "rounded" || corners === "default" || corners === "") {
    return null
  }

  if (corners === "sharp") {
    return "sharp"
  }

  return null
}

function isPrivateHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "")
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host === "metadata.google.internal"
  ) {
    return true
  }

  const match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (!match) {
    return false
  }

  const parts = match.slice(1).map(Number)
  if (parts.some((part) => part > 255)) {
    return true
  }

  const [a, b] = parts
  if (a === 10 || a === 127 || a === 0 || a === 255) {
    return true
  }
  if (a === 169 && b === 254) {
    return true
  }
  if (a === 192 && b === 168) {
    return true
  }
  if (a === 172 && b >= 16 && b <= 31) {
    return true
  }

  return false
}

export function readThemeLogoUrl(value: unknown): string | null {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  if (!trimmed || trimmed.length > LOGO_URL_MAX) {
    return null
  }

  if (trimmed.startsWith("data:")) {
    return DATA_IMAGE_URL.test(trimmed) ? trimmed : null
  }

  if (trimmed.startsWith("/")) {
    return ROOT_PATH.test(trimmed) ? trimmed : null
  }

  const url = readHttpUrl(trimmed)
  if (!url) {
    return null
  }

  try {
    const parsed = new URL(url)
    if (parsed.username || parsed.password || isPrivateHost(parsed.hostname)) {
      return null
    }
  } catch {
    return null
  }

  return url
}

function persistableLogoUrl(value: string | null) {
  if (!value || value.startsWith("data:") || value.startsWith("/")) {
    return null
  }

  return value
}

export function normalizeQuizTheme(value: unknown): QuizTheme {
  if (!isPlainObject(value)) {
    return { ...EMPTY_QUIZ_THEME }
  }

  const background = normalizeBackground(value.background)
  const backgroundColor = normalizeHexColor(value.background_color)
  const customBackground = background === "custom" ? backgroundColor : null

  return {
    accent: normalizeHexColor(value.accent),
    background: background === "custom" && !customBackground ? null : background,
    background_color: customBackground,
    font: normalizeFont(value.font),
    corners: normalizeCorners(value.corners),
    logo_url: readThemeLogoUrl(value.logo_url),
  }
}

export function quizThemeToJson(theme: QuizTheme): Record<string, string> {
  const json: Record<string, string> = {}

  if (theme.accent) {
    json.accent = theme.accent
  }
  if (theme.background) {
    json.background = theme.background
  }
  if (theme.background_color) {
    json.background_color = theme.background_color
  }
  if (theme.font) {
    json.font = theme.font
  }
  if (theme.corners) {
    json.corners = theme.corners
  }
  if (theme.logo_url) {
    json.logo_url = theme.logo_url
  }

  return json
}

export function persistQuizTheme(value: unknown): Record<string, string> {
  const theme = normalizeQuizTheme(value)
  return quizThemeToJson({
    ...theme,
    logo_url: persistableLogoUrl(theme.logo_url),
  })
}

export function quizThemeAffectsSurface(theme: QuizTheme) {
  return Boolean(
    theme.accent || theme.background || theme.font || theme.corners
  )
}

export function resolveQuizBackgroundHex(theme: QuizTheme) {
  if (!theme.background) {
    return null
  }

  if (theme.background === "custom") {
    return theme.background_color
  }

  return QUIZ_BACKGROUND_COLORS[theme.background]
}

import {
  contrastRatio,
  isDarkHex,
  mixHex,
  readableForeground,
  readableMuted,
} from "@/lib/quiz/theme-contrast"
import {
  normalizeQuizTheme,
  quizThemeAffectsSurface,
  resolveQuizBackgroundHex,
  type QuizHeadingFont,
} from "@/lib/quiz/theme"

export const DEFAULT_SHARE_PAPER =
  "linear-gradient(145deg, #f7f3ee 0%, #efe8df 48%, #e8dcc8 100%)"
export const DEFAULT_SHARE_INK = "#2c2419"
export const DEFAULT_SHARE_MUTED = "#5c4f3d"
export const DEFAULT_SHARE_FAINT = "#7a6a55"
export const DEFAULT_SHARE_ACCENT = "#d4a853"
export const DEFAULT_SHARE_FRAME = "#fffaf3"
export const DEFAULT_SHARE_FONT = "Georgia, serif"

const LIGHT_SURFACE = "#ffffff"

export type SharePaint = {
  paper: string
  ink: string
  muted: string
  faint: string
  accent: string
  onAccent: string
  frame: string
  font: string
  sharp: boolean
}

export const DEFAULT_SHARE_PAINT: SharePaint = {
  paper: DEFAULT_SHARE_PAPER,
  ink: DEFAULT_SHARE_INK,
  muted: DEFAULT_SHARE_MUTED,
  faint: DEFAULT_SHARE_FAINT,
  accent: DEFAULT_SHARE_ACCENT,
  onAccent: DEFAULT_SHARE_INK,
  frame: DEFAULT_SHARE_FRAME,
  font: DEFAULT_SHARE_FONT,
  sharp: false,
}

export type QuizThemeAttrs = {
  "data-quiz-theme": ""
  "data-quiz-font"?: QuizHeadingFont
  "data-quiz-corners"?: "sharp"
  "data-quiz-scheme"?: "light" | "dark"
  style: Record<string, string>
}

const PRESET_CARDS = {
  light: "#ffffff",
  dark: "#221f1c",
  parchment: "#fffaf3",
  night: "#1c2233",
} as const

function surfacePalette(
  background: string,
  accent: string | null,
  cardHint?: string
) {
  const foreground = readableForeground(background)
  const dark = isDarkHex(background)
  const card =
    cardHint ?? (dark ? mixHex(background, foreground, 0.08) : background)
  const muted = dark
    ? mixHex(background, foreground, 0.14)
    : mixHex(background, foreground, 0.05)
  const border = mixHex(background, foreground, dark ? 0.24 : 0.16)
  const hover = accent
    ? mixHex(background, accent, dark ? 0.22 : 0.12)
    : mixHex(background, foreground, dark ? 0.16 : 0.08)

  const style: Record<string, string> = {
    "--background": background,
    "--foreground": foreground,
    "--card": card,
    "--card-foreground": foreground,
    "--popover": card,
    "--popover-foreground": foreground,
    "--muted": muted,
    "--muted-foreground": readableMuted(background, 0.72),
    "--secondary": muted,
    "--secondary-foreground": foreground,
    "--accent": hover,
    "--accent-foreground": foreground,
    "--border": border,
    "--input": border,
    "--ring": accent ?? readableMuted(background, 0.8),
    colorScheme: dark ? "dark" : "light",
  }

  if (accent) {
    style["--primary"] = accent
    style["--primary-foreground"] = readableForeground(accent)
  }

  return { style, dark }
}

export function quizThemeAttrs(value: unknown): QuizThemeAttrs | null {
  const theme = normalizeQuizTheme(value)
  if (!quizThemeAffectsSurface(theme)) {
    return null
  }

  const attrs: QuizThemeAttrs = {
    "data-quiz-theme": "",
    style: {},
  }
  const background = resolveQuizBackgroundHex(theme)

  if (background) {
    const cardHint =
      theme.background && theme.background !== "custom"
        ? PRESET_CARDS[theme.background]
        : undefined
    const palette = surfacePalette(background, theme.accent, cardHint)
    attrs.style = palette.style
    attrs["data-quiz-scheme"] = palette.dark ? "dark" : "light"
  } else if (theme.accent) {
    attrs.style = {
      "--primary": theme.accent,
      "--primary-foreground": readableForeground(theme.accent),
      "--ring": theme.accent,
    }
  }

  if (theme.font) {
    attrs["data-quiz-font"] = theme.font
  }

  if (theme.corners === "sharp") {
    attrs["data-quiz-corners"] = "sharp"
    attrs.style = { ...attrs.style, "--radius": "0px" }
  }

  return attrs
}

function paperGradient(background: string) {
  const ink = readableForeground(background)
  return `linear-gradient(145deg, ${mixHex(background, ink, 0.03)} 0%, ${background} 48%, ${mixHex(background, ink, 0.08)} 100%)`
}

export function sharePaintFromTheme(value: unknown): SharePaint {
  const theme = normalizeQuizTheme(value)
  const background = resolveQuizBackgroundHex(theme)
  const accent = theme.accent
  const sharp = theme.corners === "sharp"

  if (!background && !accent && !sharp) {
    return DEFAULT_SHARE_PAINT
  }

  const paint: SharePaint = { ...DEFAULT_SHARE_PAINT, sharp }

  if (background) {
    const dark = isDarkHex(background)
    paint.paper =
      theme.background === "parchment" ? DEFAULT_SHARE_PAPER : paperGradient(background)
    paint.ink = readableForeground(background)
    paint.muted = readableMuted(background, 0.7)
    paint.faint = readableMuted(background, 0.52)
    paint.frame = dark
      ? mixHex(background, paint.ink, 0.35)
      : mixHex(background, LIGHT_SURFACE, 0.72)
    if (contrastRatio(paint.ink, background) < 4.5) {
      paint.ink = readableForeground(background)
    }
  }

  if (accent) {
    paint.accent = accent
    paint.onAccent = readableForeground(accent)
  }

  return paint
}


import {
  contrastRatio,
  isDarkHex,
  meetsWcagAA,
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

export type QuizSurfaceTokens = {
  background: string
  text: string
  muted: string
  heading: string
  border: string
  option: string
  optionText: string
  optionHover: string
  optionHoverText: string
  optionSelected: string
  optionSelectedText: string
  optionSelectedBorder: string
  buttonText: string
  ring: string
  callout: string
  calloutText: string
  card: string
  cardText: string
  dark: boolean
}

function textOn(surface: string, preferred: string) {
  return meetsWcagAA(preferred, surface) ? preferred : readableForeground(surface)
}

function componentColor(candidate: string, surface: string, fallback: string) {
  return contrastRatio(candidate, surface) >= 3 ? candidate : fallback
}

export function deriveQuizSurfaceTokens(
  background: string,
  accent: string | null,
  cardHint?: string
): QuizSurfaceTokens {
  const text = readableForeground(background)
  const dark = isDarkHex(background)
  const border = mixHex(background, text, dark ? 0.28 : 0.18)
  const option = mixHex(background, text, dark ? 0.1 : 0.045)
  const optionText = textOn(option, text)
  const hoverTint = accent ?? text
  const optionHover = mixHex(
    option,
    hoverTint,
    accent ? (dark ? 0.22 : 0.14) : dark ? 0.12 : 0.06
  )
  const optionHoverText = textOn(optionHover, text)
  const selectedTint = accent ?? text
  const optionSelected = mixHex(
    background,
    selectedTint,
    accent ? (dark ? 0.4 : 0.16) : dark ? 0.18 : 0.08
  )
  const optionSelectedText = textOn(optionSelected, text)
  const optionSelectedBorder = accent
    ? componentColor(accent, optionSelected, text)
    : border
  const buttonText = accent ? readableForeground(accent) : text
  const ring = accent ? componentColor(accent, background, text) : text
  const callout = mixHex(
    background,
    accent ?? text,
    accent ? (dark ? 0.2 : 0.1) : dark ? 0.12 : 0.05
  )
  const card =
    cardHint ?? (dark ? mixHex(background, text, 0.08) : mixHex(background, "#ffffff", 0.72))

  return {
    background,
    text,
    muted: readableMuted(background, 0.72),
    heading: text,
    border,
    option,
    optionText,
    optionHover,
    optionHoverText,
    optionSelected,
    optionSelectedText,
    optionSelectedBorder,
    buttonText,
    ring,
    callout,
    calloutText: textOn(callout, text),
    card,
    cardText: textOn(card, text),
    dark,
  }
}

function surfacePalette(
  background: string,
  accent: string | null,
  cardHint?: string
) {
  const tokens = deriveQuizSurfaceTokens(background, accent, cardHint)
  const mutedSurface = tokens.dark
    ? mixHex(background, tokens.text, 0.14)
    : mixHex(background, tokens.text, 0.05)

  const style: Record<string, string> = {
    "--background": tokens.background,
    "--foreground": tokens.text,
    "--card": tokens.card,
    "--card-foreground": tokens.cardText,
    "--popover": tokens.card,
    "--popover-foreground": tokens.cardText,
    "--muted": mutedSurface,
    "--muted-foreground": tokens.muted,
    "--secondary": tokens.option,
    "--secondary-foreground": tokens.optionText,
    "--accent": tokens.optionHover,
    "--accent-foreground": tokens.optionHoverText,
    "--border": tokens.border,
    "--input": tokens.option,
    "--ring": tokens.ring,
    "--quiz-text": tokens.text,
    "--quiz-muted": tokens.muted,
    "--quiz-heading": tokens.heading,
    "--quiz-border": tokens.border,
    "--quiz-option": tokens.option,
    "--quiz-option-text": tokens.optionText,
    "--quiz-option-hover": tokens.optionHover,
    "--quiz-option-hover-text": tokens.optionHoverText,
    "--quiz-option-selected": tokens.optionSelected,
    "--quiz-option-selected-text": tokens.optionSelectedText,
    "--quiz-option-selected-border": tokens.optionSelectedBorder,
    "--quiz-button-text": tokens.buttonText,
    "--quiz-ring": tokens.ring,
    "--quiz-callout": tokens.callout,
    "--quiz-callout-text": tokens.calloutText,
    colorScheme: tokens.dark ? "dark" : "light",
  }

  if (accent) {
    style["--primary"] = accent
    style["--primary-foreground"] = tokens.buttonText
  }

  return { style, dark: tokens.dark }
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
    const buttonText = readableForeground(theme.accent)
    attrs.style = {
      "--primary": theme.accent,
      "--primary-foreground": buttonText,
      "--quiz-button-text": buttonText,
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
    const tokens = deriveQuizSurfaceTokens(background, accent)
    paint.paper =
      theme.background === "parchment" ? DEFAULT_SHARE_PAPER : paperGradient(background)
    paint.ink = tokens.text
    paint.muted = tokens.muted
    paint.faint = readableMuted(background, 0.52)
    paint.frame = tokens.dark
      ? mixHex(background, tokens.text, 0.35)
      : mixHex(background, LIGHT_SURFACE, 0.72)
    paint.onAccent = tokens.buttonText
  }

  if (accent) {
    paint.accent = accent
    paint.onAccent = readableForeground(accent)
  }

  return paint
}


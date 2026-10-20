import {
  normalizeQuizTheme,
  resolveQuizBackgroundHex,
  type QuizTheme,
} from "@/lib/quiz/theme"

const SOFT_INK = "#1c1917"
const SOFT_PAPER = "#fffaf6"
const PURE_INK = "#000000"
const PURE_PAPER = "#ffffff"

export type Rgb = { r: number; g: number; b: number }

export function parseHex(value: string): Rgb | null {
  const match = /^#([0-9a-f]{6})$/i.exec(value.trim())
  if (!match) {
    return null
  }

  const hex = match[1]
  return {
    r: Number.parseInt(hex.slice(0, 2), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    b: Number.parseInt(hex.slice(4, 6), 16),
  }
}

export function toHex({ r, g, b }: Rgb) {
  const channel = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value)))
      .toString(16)
      .padStart(2, "0")

  return `#${channel(r)}${channel(g)}${channel(b)}`
}

function srgbChannel(value: number) {
  const channel = value / 255
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4
}

export function relativeLuminance(hex: string) {
  const rgb = parseHex(hex)
  if (!rgb) {
    return 0
  }

  return (
    0.2126 * srgbChannel(rgb.r) +
    0.7152 * srgbChannel(rgb.g) +
    0.0722 * srgbChannel(rgb.b)
  )
}

export function contrastRatio(foreground: string, background: string) {
  const lighter = Math.max(
    relativeLuminance(foreground),
    relativeLuminance(background)
  )
  const darker = Math.min(
    relativeLuminance(foreground),
    relativeLuminance(background)
  )

  return (lighter + 0.05) / (darker + 0.05)
}

export function meetsWcagAA(
  foreground: string,
  background: string,
  large = false
) {
  return contrastRatio(foreground, background) >= (large ? 3 : 4.5)
}

export function mixHex(from: string, to: string, amount: number) {
  const start = parseHex(from)
  const end = parseHex(to)
  if (!start || !end) {
    return from
  }

  const weight = Math.max(0, Math.min(1, amount))
  return toHex({
    r: start.r + (end.r - start.r) * weight,
    g: start.g + (end.g - start.g) * weight,
    b: start.b + (end.b - start.b) * weight,
  })
}

export function readableForeground(background: string) {
  const softInk = contrastRatio(SOFT_INK, background)
  const softPaper = contrastRatio(SOFT_PAPER, background)

  if (softInk >= 4.5 && softInk >= softPaper) {
    return SOFT_INK
  }
  if (softPaper >= 4.5) {
    return SOFT_PAPER
  }

  return contrastRatio(PURE_INK, background) >=
    contrastRatio(PURE_PAPER, background)
    ? PURE_INK
    : PURE_PAPER
}

export function readableMuted(background: string, start = 0.68) {
  const foreground = readableForeground(background)

  for (let amount = start; amount <= 1; amount += 0.04) {
    const color = mixHex(background, foreground, amount)
    if (contrastRatio(color, background) >= 4.5) {
      return color
    }
  }

  return foreground
}

export function isDarkHex(hex: string) {
  return readableForeground(hex) === SOFT_PAPER || readableForeground(hex) === PURE_PAPER
}

function formatRatio(ratio: number) {
  return `${ratio.toFixed(1)}:1`
}

export function themeContrastWarnings(value: unknown) {
  const theme: QuizTheme = normalizeQuizTheme(value)
  const warnings: string[] = []
  const background = resolveQuizBackgroundHex(theme)

  if (theme.background === "custom" && theme.background_color) {
    const foreground = readableForeground(theme.background_color)
    const ratio = contrastRatio(foreground, theme.background_color)
    if (ratio < 4.5) {
      warnings.push(
        `This background cannot hold readable text at WCAG AA (4.5:1). Best contrast is ${formatRatio(ratio)}.`
      )
    }
  }

  if (!theme.accent) {
    return warnings
  }

  const surfaces = background
    ? [{ hex: background, label: "this background" }]
    : [
        { hex: "#ffffff", label: "a light page" },
        { hex: "#171513", label: "a dark page" },
      ]

  for (const surface of surfaces) {
    const ratio = contrastRatio(theme.accent, surface.hex)
    if (ratio < 3) {
      warnings.push(
        `Accent contrast on ${surface.label} is ${formatRatio(ratio)}, below WCAG AA (3:1).`
      )
    }
  }

  const onAccent = readableForeground(theme.accent)
  const textRatio = contrastRatio(onAccent, theme.accent)
  if (textRatio < 4.5) {
    warnings.push(
      `Text on this accent is ${formatRatio(textRatio)}, below WCAG AA (4.5:1).`
    )
  }

  return warnings
}

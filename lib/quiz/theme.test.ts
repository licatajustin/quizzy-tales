import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  deriveQuizSurfaceTokens,
  sharePaintFromTheme,
  quizThemeAttrs,
} from "./theme-style.ts"
import {
  contrastRatio,
  meetsWcagAA,
  readableForeground,
  readableMuted,
  relativeLuminance,
  themeContrastWarnings,
} from "./theme-contrast.ts"
import {
  EMPTY_QUIZ_THEME,
  normalizeQuizTheme,
  persistQuizTheme,
  quizThemeToJson,
} from "./theme.ts"

const ALLOWED_KEYS = [
  "accent",
  "background",
  "background_color",
  "font",
  "corners",
  "logo_url",
]

describe("normalizeQuizTheme", () => {
  it("falls back to the standard theme for missing or invalid input", () => {
    for (const value of [undefined, null, [], "parchment", 4, { accent: "red" }]) {
      assert.deepEqual(normalizeQuizTheme(value), EMPTY_QUIZ_THEME)
    }
  })

  it("keeps valid fields and drops the rest", () => {
    assert.deepEqual(
      normalizeQuizTheme({
        accent: " #C8962E ",
        background: "parchment",
        background_color: "#ffffff",
        font: "story",
        corners: "sharp",
        logo_url: "https://cdn.example.com/mark.png",
        extra: "nope",
      }),
      {
        accent: "#c8962e",
        background: "parchment",
        background_color: null,
        font: "story",
        corners: "sharp",
        logo_url: "https://cdn.example.com/mark.png",
      }
    )
  })

  it("requires a custom background color and ignores short hex", () => {
    assert.deepEqual(
      normalizeQuizTheme({
        background: "custom",
        background_color: "#112233",
        accent: "#fff",
        font: "default",
        corners: "rounded",
      }),
      {
        ...EMPTY_QUIZ_THEME,
        background: "custom",
        background_color: "#112233",
      }
    )

    assert.deepEqual(
      normalizeQuizTheme({ background: "custom" }),
      EMPTY_QUIZ_THEME
    )
  })

  it("rejects unsafe logo urls and keeps a small preview image", () => {
    assert.equal(
      normalizeQuizTheme({ logo_url: "javascript:alert(1)" }).logo_url,
      null
    )
    assert.equal(
      normalizeQuizTheme({ logo_url: "https://127.0.0.1/logo.png" }).logo_url,
      null
    )
    assert.equal(
      normalizeQuizTheme({
        logo_url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'/>",
      }).logo_url,
      "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'/>"
    )
  })

  it("stores only the public http logo and the shape the database accepts", () => {
    const stored = persistQuizTheme({
      accent: "#aabbcc",
      background: "night",
      font: "modern",
      corners: "sharp",
      logo_url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'/>",
      unknown: true,
    })

    assert.deepEqual(Object.keys(stored).sort(), [
      "accent",
      "background",
      "corners",
      "font",
    ])
    assert.deepEqual(stored, quizThemeToJson(normalizeQuizTheme(stored)))
    for (const key of Object.keys(stored)) {
      assert.ok(ALLOWED_KEYS.includes(key))
    }
    assert.match(stored.accent, /^#[0-9a-f]{6}$/)
  })
})

describe("theme contrast", () => {
  it("measures black on white as 21:1", () => {
    const ratio = contrastRatio("#000000", "#ffffff")
    assert.ok(Math.abs(ratio - 21) < 0.05)
    assert.equal(meetsWcagAA("#000000", "#ffffff"), true)
    assert.equal(meetsWcagAA("#777777", "#888888"), false)
  })

  it("picks a readable foreground and muted color for light and dark surfaces", () => {
    for (const background of ["#ffffff", "#f3ead7", "#171513", "#141824", "#808080"]) {
      const foreground = readableForeground(background)
      const muted = readableMuted(background)
      assert.equal(meetsWcagAA(foreground, background), true)
      assert.equal(meetsWcagAA(muted, background), true)
    }

    assert.equal(readableForeground("#ffffff"), "#1c1917")
    assert.notEqual(readableForeground("#141824"), "#1c1917")
  })

  it("warns when a custom accent fails WCAG AA", () => {
    const pale = themeContrastWarnings({
      accent: "#eeeeee",
      background: "light",
    })
    assert.ok(pale.some((warning) => warning.includes("WCAG AA")))

    const strong = themeContrastWarnings({
      accent: "#5b2a4a",
      background: "parchment",
    })
    assert.deepEqual(strong, [])
  })
})

describe("quiz theme surface", () => {
  it("leaves an empty theme unstyled", () => {
    assert.equal(quizThemeAttrs(null), null)
    assert.equal(quizThemeAttrs({ font: "default", corners: "rounded" }), null)
  })

  it("sets accessible colors, type, and sharp corners", () => {
    const attrs = quizThemeAttrs({
      accent: "#d4b483",
      background: "night",
      font: "story",
      corners: "sharp",
    })

    assert.ok(attrs)
    assert.equal(attrs?.["data-quiz-scheme"], "dark")
    assert.equal(attrs?.["data-quiz-font"], "story")
    assert.equal(attrs?.["data-quiz-corners"], "sharp")
    assert.equal(attrs?.style["--radius"], "0px")
    assert.equal(attrs?.style["--background"], "#141824")
    assert.equal(
      meetsWcagAA(
        String(attrs?.style["--foreground"]),
        String(attrs?.style["--background"])
      ),
      true
    )
    assert.equal(
      meetsWcagAA(
        String(attrs?.style["--primary-foreground"]),
        String(attrs?.style["--primary"])
      ),
      true
    )
    assert.equal(
      meetsWcagAA(
        String(attrs?.style["--muted-foreground"]),
        String(attrs?.style["--background"])
      ),
      true
    )
  })

  it("derives readable tokens for light, dark, parchment, night, and custom colors", () => {
    const cases = [
      {
        name: "light",
        theme: { background: "light", accent: "#d4b483" },
        dark: false,
      },
      {
        name: "dark",
        theme: { background: "dark", accent: "#d4b483" },
        dark: true,
      },
      {
        name: "parchment",
        theme: { background: "parchment", accent: "#8c3a4b" },
        dark: false,
      },
      {
        name: "night",
        theme: { background: "night", accent: "#d4b483" },
        dark: true,
      },
      {
        name: "custom dark",
        theme: {
          background: "custom",
          background_color: "#10241c",
          accent: "#e7c27a",
        },
        dark: true,
      },
      {
        name: "custom light",
        theme: {
          background: "custom",
          background_color: "#f6f1e7",
          accent: "#2a6f8f",
        },
        dark: false,
      },
    ] as const

    for (const item of cases) {
      const attrs = quizThemeAttrs(item.theme)
      assert.ok(attrs, item.name)
      const style = attrs.style
      const pairs = [
        ["--quiz-text", "--background"],
        ["--quiz-muted", "--background"],
        ["--quiz-heading", "--background"],
        ["--quiz-option-text", "--quiz-option"],
        ["--quiz-option-hover-text", "--quiz-option-hover"],
        ["--quiz-option-selected-text", "--quiz-option-selected"],
        ["--quiz-button-text", "--primary"],
        ["--quiz-callout-text", "--quiz-callout"],
        ["--foreground", "--background"],
        ["--card-foreground", "--card"],
      ] as const

      for (const [foreground, background] of pairs) {
        assert.equal(
          meetsWcagAA(String(style[foreground]), String(style[background])),
          true,
          `${item.name} ${foreground} on ${background}`
        )
      }

      assert.equal(style["--quiz-text"], style["--foreground"])
      assert.equal(style["--quiz-heading"], style["--quiz-text"])
      assert.equal(style["--quiz-button-text"], style["--primary-foreground"])
      assert.equal(attrs["data-quiz-scheme"], item.dark ? "dark" : "light")

      const text = relativeLuminance(String(style["--quiz-text"]))
      const surface = relativeLuminance(String(style["--background"]))
      if (item.dark) {
        assert.ok(text > surface, item.name)
        assert.notEqual(style["--quiz-text"], "#1c1917")
      } else {
        assert.ok(text < surface, item.name)
        assert.notEqual(style["--quiz-text"], "#fffaf6")
      }

      const paint = sharePaintFromTheme(item.theme)
      assert.equal(paint.ink, style["--quiz-text"])
      assert.equal(
        meetsWcagAA(paint.ink, String(style["--background"])),
        true,
        item.name
      )
      assert.equal(
        meetsWcagAA(paint.onAccent, String(style["--primary"])),
        true,
        item.name
      )
    }
  })

  it("flips accent text when the accent cannot hold the page ink", () => {
    const paleOnNight = deriveQuizSurfaceTokens("#141824", "#f4efe4")
    assert.equal(meetsWcagAA(paleOnNight.buttonText, "#f4efe4"), true)
    assert.ok(
      relativeLuminance(paleOnNight.buttonText) <
        relativeLuminance("#f4efe4")
    )
    assert.equal(
      meetsWcagAA(paleOnNight.optionSelectedText, paleOnNight.optionSelected),
      true
    )
    assert.equal(
      meetsWcagAA(paleOnNight.optionHoverText, paleOnNight.optionHover),
      true
    )

    const inkOnNight = deriveQuizSurfaceTokens("#141824", "#14120e")
    assert.equal(meetsWcagAA(inkOnNight.buttonText, "#14120e"), true)
    assert.ok(
      relativeLuminance(inkOnNight.buttonText) >
        relativeLuminance("#14120e")
    )
  })

  it("keeps the standard share card unless a theme changes it", () => {
    const standard = sharePaintFromTheme(undefined)
    assert.equal(standard.paper.includes("#f7f3ee"), true)
    assert.equal(standard.accent, "#d4a853")
    assert.equal(standard.sharp, false)

    const themed = sharePaintFromTheme({
      background: "night",
      accent: "#d4b483",
      corners: "sharp",
    })
    assert.notEqual(themed.paper, standard.paper)
    assert.equal(themed.accent, "#d4b483")
    assert.equal(themed.sharp, true)
    assert.equal(meetsWcagAA(themed.ink, "#141824"), true)
    assert.equal(meetsWcagAA(themed.onAccent, themed.accent), true)
  })
})

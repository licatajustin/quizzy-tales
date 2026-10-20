"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { updateQuizTheme } from "@/app/actions/quizzes"
import { ThemeLogoControls } from "@/components/dashboard/quiz-editor/theme-logo-controls"
import { OutcomeResultBody } from "@/components/quiz/outcome-result-body"
import { QuizAuthorLogo } from "@/components/quiz/quiz-author-logo"
import { QuizIntroHero } from "@/components/quiz/quiz-intro-hero"
import { QuizThemeScope } from "@/components/quiz/quiz-theme-scope"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { themeContrastWarnings } from "@/lib/quiz/theme-contrast"
import {
  normalizeHexColor,
  normalizeQuizTheme,
  persistQuizTheme,
  QUIZ_BACKGROUND_COLORS,
  quizThemeToJson,
  type QuizBackgroundStyle,
  type QuizCornerStyle,
  type QuizHeadingFont,
} from "@/lib/quiz/theme"
import type { OutcomeRow, PublishedOutcome, PublishedQuizSnapshot, QuizRow } from "@/lib/quiz/types"
import { cn } from "@/lib/utils"

const HEX_ERROR = "Use a 6-digit hex color, such as #c8962e."

const ACCENT_PRESETS = [
  { name: "Gold", value: "#c8962e" },
  { name: "Forest", value: "#2f6b4f" },
  { name: "Wine", value: "#8c3a4b" },
  { name: "Sea", value: "#2a6f8f" },
  { name: "Ink", value: "#243044" },
] as const

const BACKGROUNDS: {
  value: "default" | QuizBackgroundStyle
  label: string
}[] = [
  { value: "default", label: "Default" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "parchment", label: "Parchment" },
  { value: "night", label: "Night" },
  { value: "custom", label: "Custom" },
]

const FONTS: {
  value: "default" | QuizHeadingFont
  label: string
  family: string
}[] = [
  { value: "default", label: "Default", family: "var(--font-sans), sans-serif" },
  {
    value: "serif",
    label: "Serif display",
    family: "var(--font-quiz-serif), Georgia, serif",
  },
  {
    value: "story",
    label: "Storybook",
    family: "var(--font-quiz-story), Georgia, serif",
  },
  {
    value: "modern",
    label: "Modern sans",
    family: "var(--font-quiz-modern), var(--font-sans), sans-serif",
  },
]

type EditorBackground = "default" | QuizBackgroundStyle
type EditorFont = "default" | QuizHeadingFont
type EditorCorners = QuizCornerStyle

type DesignTabProps = {
  quiz: QuizRow
  outcomes: OutcomeRow[]
  questionCount: number
}

function swatchFor(value: EditorBackground, customColor: string) {
  if (value === "default") {
    return "linear-gradient(135deg, #ffffff 50%, #171513 50%)"
  }
  if (value === "custom") {
    return normalizeHexColor(customColor) ?? "#f3ead7"
  }
  return QUIZ_BACKGROUND_COLORS[value]
}

function previewOutcome(outcomes: OutcomeRow[]): PublishedOutcome {
  const outcome = outcomes[0]
  if (!outcome) {
    return {
      id: "preview",
      name: "The Quiet One",
      description: "A short portrait of this result.",
      image_url: null,
      sort_order: 0,
      tagline: "The one readers remember",
      details: [
        { label: "Keepsake", kind: "chips", value: ["A letter", "A key"] },
      ],
    }
  }

  return {
    id: outcome.id,
    name: outcome.name || "Result",
    description: outcome.description,
    image_url: outcome.image_url,
    sort_order: outcome.sort_order,
    tagline: outcome.tagline,
    details: outcome.details,
  }
}

export function DesignTab({ quiz, outcomes, questionCount }: DesignTabProps) {
  const router = useRouter()
  const saved = normalizeQuizTheme(quiz.theme)
  const [accent, setAccent] = useState(saved.accent ?? "")
  const [background, setBackground] = useState<EditorBackground>(
    saved.background ?? "default"
  )
  const [backgroundColor, setBackgroundColor] = useState(
    saved.background_color ?? "#f3ead7"
  )
  const [font, setFont] = useState<EditorFont>(saved.font ?? "default")
  const [corners, setCorners] = useState<EditorCorners>(
    saved.corners ?? "rounded"
  )
  const [logoUrl, setLogoUrl] = useState<string | null>(saved.logo_url)
  const logoUrlRef = useRef(logoUrl)
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle"
  )
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedSignature = useRef(JSON.stringify(quizThemeToJson(saved)))

  useEffect(() => {
    logoUrlRef.current = logoUrl
  }, [logoUrl])

  const accentHex = normalizeHexColor(accent)
  const accentError = accent.trim() && !accentHex ? HEX_ERROR : null
  const backgroundHex = normalizeHexColor(backgroundColor)
  const backgroundError =
    background === "custom" && backgroundColor.trim() && !backgroundHex
      ? HEX_ERROR
      : null

  function readPayload() {
    return {
      accent: accentHex,
      background: background === "default" ? null : background,
      background_color: background === "custom" ? backgroundHex : null,
      font: font === "default" ? null : font,
      corners: corners === "rounded" ? null : corners,
      logo_url: logoUrlRef.current,
    }
  }

  const appliedTheme = useMemo(
    () =>
      normalizeQuizTheme({
        accent: accentHex,
        background: background === "default" ? null : background,
        background_color: background === "custom" ? backgroundHex : null,
        font: font === "default" ? null : font,
        corners: corners === "rounded" ? null : corners,
        logo_url: logoUrl,
      }),
    [accentHex, background, backgroundHex, corners, font, logoUrl]
  )
  const warnings = themeContrastWarnings(appliedTheme)
  const previewSnapshot: PublishedQuizSnapshot = {
    quiz_title: quiz.quiz_title,
    book_title: quiz.book_title,
    intro_text: quiz.intro_text,
    cover_image_url: quiz.cover_image_url,
    theme: appliedTheme,
    outcomes: [],
    questions: [],
    published_at: quiz.updated_at,
  }
  const result = previewOutcome(outcomes)

  useEffect(() => {
    if (accentError || backgroundError) {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      return
    }

    const payload = {
      accent: accentHex,
      background: background === "default" ? null : background,
      background_color: background === "custom" ? backgroundHex : null,
      font: font === "default" ? null : font,
      corners: corners === "rounded" ? null : corners,
      logo_url: logoUrl,
    }
    const signature = JSON.stringify(persistQuizTheme(payload))
    if (signature === savedSignature.current) {
      return
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(async () => {
      setSaveState("saving")
      const result = await updateQuizTheme(quiz.id, payload)

      if (result.error || !result.theme) {
        toast.error(result.error ?? "Could not save design.")
        setSaveState("idle")
        return
      }

      savedSignature.current = JSON.stringify(result.theme)
      setSaveState("saved")
      toast.success("Design saved")
      router.refresh()
    }, 700)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [
    accentError,
    accentHex,
    background,
    backgroundError,
    backgroundHex,
    corners,
    font,
    logoUrl,
    quiz.id,
    router,
  ])

  function resetDesign() {
    setAccent("")
    setBackground("default")
    setBackgroundColor("#f3ead7")
    setFont("default")
    setCorners("rounded")
    setLogoUrl(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="bg-card">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1">
            <CardTitle>Quiz design</CardTitle>
            <CardDescription>
              Choose colors, type, and a logo so the public quiz feels like
              your book. Saves as you type. Readers see it after you update
              the live quiz.
            </CardDescription>
          </div>
          <p className="shrink-0 text-xs text-muted-foreground">
            {saveState === "saving"
              ? "Saving..."
              : saveState === "saved"
                ? "Saved"
                : ""}
          </p>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel>Background</FieldLabel>
              <div
                role="radiogroup"
                aria-label="Background"
                className="flex flex-wrap gap-2"
              >
                {BACKGROUNDS.map((option) => {
                  const selected = background === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm",
                        selected
                          ? "border-foreground bg-background"
                          : "border-border/70 bg-muted/30"
                      )}
                      onClick={() => setBackground(option.value)}
                    >
                      <span
                        aria-hidden
                        className="size-3.5 rounded-full border border-border"
                        style={{
                          background: swatchFor(option.value, backgroundColor),
                        }}
                      />
                      {option.label}
                    </button>
                  )
                })}
              </div>
              <FieldDescription>
                Default follows the reader&apos;s light or dark setting.
              </FieldDescription>
            </Field>

            {background === "custom" ? (
              <Field data-invalid={backgroundError ? true : undefined}>
                <FieldLabel htmlFor="background_color">
                  Background color
                </FieldLabel>
                <div className="flex items-center gap-3">
                  <input
                    id="background_color_picker"
                    type="color"
                    aria-label="Background color picker"
                    value={backgroundHex ?? "#f3ead7"}
                    onChange={(event) => setBackgroundColor(event.target.value)}
                    className="size-9 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-1"
                  />
                  <Input
                    id="background_color"
                    value={backgroundColor}
                    spellCheck={false}
                    autoCapitalize="off"
                    aria-invalid={backgroundError ? true : undefined}
                    onChange={(event) => setBackgroundColor(event.target.value)}
                    className="max-w-40 font-mono"
                  />
                </div>
                <FieldError>{backgroundError}</FieldError>
              </Field>
            ) : null}

            <Field data-invalid={accentError ? true : undefined}>
              <FieldLabel htmlFor="accent">Accent color</FieldLabel>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  aria-pressed={!accentHex}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm",
                    !accentHex
                      ? "border-foreground bg-background"
                      : "border-border/70"
                  )}
                  onClick={() => setAccent("")}
                >
                  Default
                </button>
                {ACCENT_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    aria-pressed={accentHex === preset.value}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm",
                      accentHex === preset.value
                        ? "border-foreground bg-background"
                        : "border-border/70"
                    )}
                    onClick={() => setAccent(preset.value)}
                  >
                    <span
                      aria-hidden
                      className="size-3.5 rounded-full border border-border"
                      style={{ background: preset.value }}
                    />
                    {preset.name}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  aria-label="Accent color picker"
                  value={accentHex ?? "#c8962e"}
                  onChange={(event) => setAccent(event.target.value)}
                  className="size-9 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-1"
                />
                <Input
                  id="accent"
                  value={accent}
                  placeholder="#c8962e"
                  spellCheck={false}
                  autoCapitalize="off"
                  aria-invalid={accentError ? true : undefined}
                  onChange={(event) => setAccent(event.target.value)}
                  className="max-w-40 font-mono"
                />
              </div>
              <FieldDescription>
                Buttons, progress, and highlights. Leave blank for the standard
                gold.
              </FieldDescription>
              <FieldError>{accentError}</FieldError>
            </Field>

            {warnings.length > 0 ? (
              <ul className="space-y-1 text-xs text-amber-700 dark:text-amber-400">
                {warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            ) : null}

            <Field>
              <FieldLabel>Heading font</FieldLabel>
              <div
                role="radiogroup"
                aria-label="Heading font"
                className="grid gap-2 sm:grid-cols-2"
              >
                {FONTS.map((option) => {
                  const selected = font === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      className={cn(
                        "rounded-xl border px-3 py-3 text-left",
                        selected
                          ? "border-foreground bg-background"
                          : "border-border/70"
                      )}
                      onClick={() => setFont(option.value)}
                    >
                      <span className="block text-xs text-muted-foreground">
                        {option.label}
                      </span>
                      <span
                        className="mt-1 block text-lg"
                        style={{ fontFamily: option.family }}
                      >
                        {quiz.quiz_title || "Which character are you?"}
                      </span>
                    </button>
                  )
                })}
              </div>
              <FieldDescription>
                Used for titles and questions on the public quiz.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel>Corners</FieldLabel>
              <div role="radiogroup" aria-label="Corners" className="flex gap-2">
                {(["rounded", "sharp"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={corners === option}
                    className={cn(
                      "border px-3 py-1.5 text-sm capitalize",
                      option === "rounded" ? "rounded-full" : "rounded-none",
                      corners === option
                        ? "border-foreground bg-background"
                        : "border-border/70"
                    )}
                    onClick={() => setCorners(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <FieldDescription>
                Sharp corners suit a stark cover. Rounded is the standard look.
              </FieldDescription>
            </Field>

            <ThemeLogoControls
              quizId={quiz.id}
              imageUrl={logoUrl}
              themePayload={readPayload}
              onImageChange={(nextLogo, theme) => {
                savedSignature.current = JSON.stringify(theme)
                setLogoUrl(nextLogo)
                router.refresh()
              }}
            />

            <div>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={resetDesign}
              >
                Reset to the standard look
              </Button>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <PreviewFrame label="Intro">
          <QuizThemeScope
            theme={appliedTheme}
            className="bg-background text-foreground"
          >
            <div className="mx-auto flex max-w-xl flex-col gap-8 px-6 py-10">
              <QuizIntroHero
                snapshot={previewSnapshot}
                questionCount={Math.max(questionCount, 1)}
                outcomeCount={Math.max(outcomes.length, 1)}
              />
              <Button
                type="button"
                size="lg"
                className="mx-auto rounded-full px-8"
              >
                Start the quiz
              </Button>
            </div>
          </QuizThemeScope>
        </PreviewFrame>
        <PreviewFrame label="Result">
          <QuizThemeScope
            theme={appliedTheme}
            className="bg-background text-foreground"
          >
            <div className="mx-auto flex max-w-xl flex-col gap-8 px-6 py-10">
              <QuizAuthorLogo
                logoUrl={appliedTheme.logo_url}
                alt={`${quiz.book_title} logo`}
              />
              <OutcomeResultBody outcome={result} quizTitle={quiz.quiz_title} />
            </div>
          </QuizThemeScope>
        </PreviewFrame>
      </div>
    </div>
  )
}

function PreviewFrame({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </h2>
      <div className="max-h-[48rem] overflow-auto rounded-xl border border-border bg-background">
        {children}
      </div>
    </section>
  )
}

import { createElement, type CSSProperties, type ReactNode } from "react"
import sharp from "sharp"

import { clipShareText, isShareImageUrl } from "@/lib/quiz/share"
import { normalizeQuizTheme } from "@/lib/quiz/theme"
import {
  sharePaintFromTheme,
  type SharePaint,
} from "@/lib/quiz/theme-style"

export const SHARE_IMAGE_SIZE = { width: 1200, height: 630 } as const
export const SHARE_IMAGE_CONTENT_TYPE = "image/png"

const MAX_IMAGE_BYTES = 8 * 1024 * 1024

function flex(style: CSSProperties, children?: ReactNode) {
  const content = Array.isArray(children)
    ? children.filter((child) => child != null && child !== false)
    : children

  return createElement("div", { style: { display: "flex", ...style } }, content)
}

function textSize(value: string, large: number, medium: number, small: number) {
  if (value.length > 48) {
    return small
  }
  if (value.length > 28) {
    return medium
  }
  return large
}

function radius(paint: SharePaint, value: number) {
  return paint.sharp ? 0 : value
}

async function readImageBytes(url: string) {
  if (!isShareImageUrl(url)) {
    return null
  }

  if (url.startsWith("data:")) {
    const encoded = url.slice(url.indexOf(",") + 1)
    const bytes = Buffer.from(encoded, "base64")
    return bytes.byteLength > 0 && bytes.byteLength <= MAX_IMAGE_BYTES
      ? bytes
      : null
  }

  const response = await fetch(url, {
    redirect: "error",
    signal: AbortSignal.timeout(8000),
  })
  if (!response.ok) {
    return null
  }

  const contentType = response.headers
    .get("content-type")
    ?.split(";")[0]
    ?.trim()
  if (contentType && !contentType.startsWith("image/")) {
    return null
  }

  const bytes = Buffer.from(await response.arrayBuffer())
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_IMAGE_BYTES) {
    return null
  }

  return bytes
}

export async function loadShareImage(
  url: string,
  width: number,
  height: number
) {
  try {
    const bytes = await readImageBytes(url.trim())
    if (!bytes) {
      return null
    }

    const png = await sharp(bytes, { failOn: "none", pages: 1 })
      .rotate()
      .resize(width, height, { fit: "cover", position: "centre" })
      .png()
      .toBuffer()

    return `data:image/png;base64,${png.toString("base64")}`
  } catch {
    return null
  }
}

function portrait(
  src: string,
  size: number,
  marginRight: number,
  paint: SharePaint
) {
  return createElement("img", {
    src,
    width: size,
    height: size,
    alt: "",
    style: {
      width: size,
      height: size,
      borderRadius: radius(paint, size / 2),
      objectFit: "cover",
      marginRight,
      border: `4px solid ${paint.frame}`,
    },
  })
}

function brandMark(paint: SharePaint, font: string) {
  return flex({ alignItems: "center", fontFamily: font }, [
    flex(
      {
        width: 44,
        height: 44,
        borderRadius: radius(paint, 12),
        background: paint.accent,
        color: paint.onAccent,
        alignItems: "center",
        justifyContent: "center",
        fontSize: 22,
        fontWeight: 700,
        marginRight: 16,
      },
      "Q"
    ),
    flex({ fontSize: 28, color: paint.ink }, "QuizzyTales"),
  ])
}

async function loadLogo(theme: unknown) {
  const logoUrl = normalizeQuizTheme(theme).logo_url
  if (!logoUrl || !isShareImageUrl(logoUrl)) {
    return null
  }

  return loadShareImage(logoUrl, 560, 144)
}

function logoMark(src: string, paint: SharePaint) {
  return createElement("img", {
    src,
    width: 280,
    height: 72,
    alt: "",
    style: {
      width: 280,
      height: 72,
      objectFit: "contain",
      objectPosition: "left",
      borderRadius: radius(paint, 8),
    },
  })
}

export async function buildQuizCollageCard(input: {
  quizTitle: string
  bookTitle: string
  portraitUrls: string[]
  theme?: unknown
  fontFamily?: string | null
}) {
  const paint = sharePaintFromTheme(input.theme)
  const font = input.fontFamily?.trim() || paint.font
  const [loaded, logoSrc] = await Promise.all([
    Promise.all(input.portraitUrls.map((url) => loadShareImage(url, 320, 320))),
    loadLogo(input.theme),
  ])
  const portraits = loaded.filter((src): src is string => Boolean(src))
  const book = clipShareText(input.bookTitle, 70)
  const title = clipShareText(input.quizTitle, 80)

  return flex(
    {
      width: "100%",
      height: "100%",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "64px",
      background: paint.paper,
      color: paint.ink,
      fontFamily: font,
    },
    [
      logoSrc ? logoMark(logoSrc, paint) : brandMark(paint, font),
      flex({ flexDirection: "column", width: 1040 }, [
        flex({ fontSize: 28, color: paint.muted, marginBottom: 18 }, book),
        flex(
          {
            fontSize: textSize(title, 64, 52, 42),
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
            color: paint.ink,
          },
          title
        ),
      ]),
      portraits.length > 0
        ? flex(
            { alignItems: "center" },
            portraits.map((src, index) =>
              portrait(src, 148, index === portraits.length - 1 ? 0 : 18, paint)
            )
          )
        : flex({ fontSize: 22, color: paint.faint }, "quizzytales.com"),
    ]
  )
}

function initial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?"
}

export async function buildOutcomeShareCard(input: {
  outcomeName: string
  tagline: string
  quizTitle: string
  bookTitle: string
  portraitUrl: string | null
  theme?: unknown
  fontFamily?: string | null
}) {
  const paint = sharePaintFromTheme(input.theme)
  const font = input.fontFamily?.trim() || paint.font
  const [portraitSrc, logoSrc] = await Promise.all([
    input.portraitUrl ? loadShareImage(input.portraitUrl, 800, 900) : null,
    loadLogo(input.theme),
  ])
  const name = clipShareText(input.outcomeName, 42)
  const tagline = clipShareText(input.tagline, 110)
  const book = clipShareText(input.bookTitle, 48)
  const quiz = clipShareText(input.quizTitle, 70)
  const frameRadius = radius(paint, 28)

  const portraitBox = portraitSrc
    ? createElement("img", {
        src: portraitSrc,
        width: 470,
        height: 534,
        alt: "",
        style: {
          width: 470,
          height: 534,
          objectFit: "cover",
          borderRadius: frameRadius,
        },
      })
    : flex(
        {
          width: 470,
          height: 534,
          borderRadius: frameRadius,
          background: paint.accent,
          color: paint.onAccent,
          alignItems: "center",
          justifyContent: "center",
          fontSize: 160,
          fontWeight: 700,
          fontFamily: font,
        },
        initial(name)
      )

  return flex(
    {
      width: "100%",
      height: "100%",
      padding: "48px",
      background: paint.paper,
      color: paint.ink,
      fontFamily: font,
    },
    [
      portraitBox,
      flex(
        {
          flexDirection: "column",
          justifyContent: "space-between",
          marginLeft: 48,
          width: 586,
          height: 534,
        },
        [
          flex({ flexDirection: "column" }, [
            logoSrc
              ? createElement("img", {
                  src: logoSrc,
                  width: 220,
                  height: 56,
                  alt: "",
                  style: {
                    width: 220,
                    height: 56,
                    objectFit: "contain",
                    objectPosition: "left",
                    marginBottom: 12,
                  },
                })
              : null,
            flex({ fontSize: 26, color: paint.muted, marginBottom: 10 }, book),
            flex({ fontSize: 22, color: paint.faint }, "QuizzyTales"),
          ]),
          flex({ flexDirection: "column", width: 586 }, [
            flex(
              {
                fontSize: textSize(name, 68, 54, 44),
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                color: paint.ink,
                marginBottom: tagline ? 18 : 0,
              },
              name
            ),
            tagline
              ? flex(
                  { fontSize: 30, lineHeight: 1.25, color: paint.muted },
                  tagline
                )
              : null,
          ]),
          flex(
            { fontSize: 28, lineHeight: 1.25, color: paint.ink, width: 586 },
            quiz
          ),
        ]
      ),
    ]
  )
}

import { createElement, type CSSProperties, type ReactNode } from "react"
import sharp from "sharp"

import { clipShareText, isShareImageUrl } from "@/lib/quiz/share"

export const SHARE_IMAGE_SIZE = { width: 1200, height: 630 } as const
export const SHARE_IMAGE_CONTENT_TYPE = "image/png"

const PAPER = "linear-gradient(145deg, #f7f3ee 0%, #efe8df 48%, #e8dcc8 100%)"
const INK = "#2c2419"
const MUTED = "#5c4f3d"
const FAINT = "#7a6a55"
const GOLD = "#d4a853"
const FONT = "Georgia, serif"
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

function portrait(src: string, size: number, marginRight: number) {
  return createElement("img", {
    src,
    width: size,
    height: size,
    alt: "",
    style: {
      width: size,
      height: size,
      borderRadius: size / 2,
      objectFit: "cover",
      marginRight,
      border: "4px solid #fffaf3",
    },
  })
}

function brandMark() {
  return flex({ alignItems: "center", fontFamily: FONT }, [
    flex(
      {
        width: 44,
        height: 44,
        borderRadius: 12,
        background: GOLD,
        color: INK,
        alignItems: "center",
        justifyContent: "center",
        fontSize: 22,
        fontWeight: 700,
        marginRight: 16,
      },
      "Q"
    ),
    flex({ fontSize: 28, color: INK }, "QuizzyTales"),
  ])
}

export async function buildQuizCollageCard(input: {
  quizTitle: string
  bookTitle: string
  portraitUrls: string[]
}) {
  const loaded = await Promise.all(
    input.portraitUrls.map((url) => loadShareImage(url, 320, 320))
  )
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
      background: PAPER,
      color: INK,
      fontFamily: FONT,
    },
    [
      brandMark(),
      flex({ flexDirection: "column", width: 1040 }, [
        flex({ fontSize: 28, color: MUTED, marginBottom: 18 }, book),
        flex(
          {
            fontSize: textSize(title, 64, 52, 42),
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
            color: INK,
          },
          title
        ),
      ]),
      portraits.length > 0
        ? flex(
            { alignItems: "center" },
            portraits.map((src, index) =>
              portrait(src, 148, index === portraits.length - 1 ? 0 : 18)
            )
          )
        : flex({ fontSize: 22, color: FAINT }, "quizzytales.com"),
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
}) {
  const portraitSrc = input.portraitUrl
    ? await loadShareImage(input.portraitUrl, 800, 900)
    : null
  const name = clipShareText(input.outcomeName, 42)
  const tagline = clipShareText(input.tagline, 110)
  const book = clipShareText(input.bookTitle, 48)
  const quiz = clipShareText(input.quizTitle, 70)

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
          borderRadius: 28,
        },
      })
    : flex(
        {
          width: 470,
          height: 534,
          borderRadius: 28,
          background: GOLD,
          color: INK,
          alignItems: "center",
          justifyContent: "center",
          fontSize: 160,
          fontWeight: 700,
          fontFamily: FONT,
        },
        initial(name)
      )

  return flex(
    {
      width: "100%",
      height: "100%",
      padding: "48px",
      background: PAPER,
      color: INK,
      fontFamily: FONT,
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
            flex({ fontSize: 26, color: MUTED, marginBottom: 10 }, book),
            flex({ fontSize: 22, color: FAINT }, "QuizzyTales"),
          ]),
          flex({ flexDirection: "column", width: 586 }, [
            flex(
              {
                fontSize: textSize(name, 68, 54, 44),
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                color: INK,
                marginBottom: tagline ? 18 : 0,
              },
              name
            ),
            tagline
              ? flex({ fontSize: 30, lineHeight: 1.25, color: MUTED }, tagline)
              : null,
          ]),
          flex(
            { fontSize: 28, lineHeight: 1.25, color: INK, width: 586 },
            quiz
          ),
        ]
      ),
    ]
  )
}

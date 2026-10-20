import assert from "node:assert/strict"
import { createRequire } from "node:module"
import { describe, it } from "node:test"

import sharp from "sharp"

import { quizPageDescription } from "./intro-text.ts"
import {
  buildOutcomeShareCard,
  buildQuizCollageCard,
} from "./share-image-card.ts"
import {
  buildResultShareMessage,
  buildResultShareText,
  collagePortraitUrls,
  findPublishedOutcome,
  isShareImageUrl,
  resultPageDescription,
  resultSharePath,
} from "./share.ts"
import type { PublishedQuizSnapshot } from "./types.ts"

const { ImageResponse } = createRequire(import.meta.url)("next/og")

const PNG_SIGNATURE = "89504e470d0a1a0a"

function snapshot(
  overrides: Partial<PublishedQuizSnapshot> = {}
): PublishedQuizSnapshot {
  return {
    quiz_title: "Which fae are you?",
    book_title: "The Winter Court",
    cover_image_url: null,
    outcomes: [
      {
        id: "later",
        name: "Later",
        description: "Arrives last.",
        image_url: "https://cdn.example.com/later.png",
        sort_order: 2,
      },
      {
        id: "ada",
        name: "Ada",
        description: "Keeps the peace.",
        image_url: "https://cdn.example.com/ada.png",
        sort_order: 0,
        tagline: "the quiet one",
      },
      {
        id: "no-art",
        name: "Bea",
        description: "",
        image_url: null,
        sort_order: 1,
      },
    ],
    questions: [],
    published_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  }
}

function textOf(node: unknown): string {
  if (node == null || typeof node === "boolean") {
    return ""
  }
  if (typeof node === "string" || typeof node === "number") {
    return String(node)
  }
  if (Array.isArray(node)) {
    return node.map(textOf).join(" ")
  }
  if (typeof node === "object" && "props" in node) {
    const props = (node as { props?: { children?: unknown } }).props
    return textOf(props?.children)
  }
  return ""
}

async function renderPng(element: unknown) {
  const response = new ImageResponse(element as never, {
    width: 1200,
    height: 630,
  })
  return Buffer.from(await response.arrayBuffer())
}

describe("result sharing", () => {
  it("uses the outcome id as the public result path", () => {
    assert.equal(
      resultSharePath(
        "which-fae-are-you",
        "11111111-1111-4111-8111-111111111111"
      ),
      "/q/which-fae-are-you/r/11111111-1111-4111-8111-111111111111"
    )
  })

  it("includes the tagline in the share text", () => {
    const text = buildResultShareText({
      outcomeName: "Ada",
      tagline: "the quiet one",
      quizTitle: "Which fae are you?",
    })

    assert.equal(text, "I got Ada, the quiet one, in Which fae are you?!")
    assert.equal(
      buildResultShareMessage(text, "https://www.quizzytales.com/q/fae/r/ada"),
      "I got Ada, the quiet one, in Which fae are you?!\nhttps://www.quizzytales.com/q/fae/r/ada"
    )
  })

  it("omits an empty tagline", () => {
    assert.equal(
      buildResultShareText({
        outcomeName: "Ada",
        tagline: "   ",
        quizTitle: "Which fae are you?",
      }),
      "I got Ada in Which fae are you?!"
    )
  })

  it("finds an outcome only from the published snapshot", () => {
    const published = snapshot()
    assert.equal(findPublishedOutcome(published, "ada")?.name, "Ada")
    assert.equal(findPublishedOutcome(published, "missing"), null)
    assert.equal(findPublishedOutcome(published, "  "), null)
  })

  it("describes a result with the tagline, then the description", () => {
    const published = snapshot()
    const ada = published.outcomes[1]
    assert.ok(ada)
    assert.equal(resultPageDescription(ada, published), "the quiet one")
    assert.equal(
      resultPageDescription(
        { ...ada, tagline: "", description: "Keeps the peace." },
        published
      ),
      "Keeps the peace."
    )
    assert.equal(
      resultPageDescription(
        { ...ada, tagline: "", description: "  ", name: "Ada" },
        published
      ),
      "I got Ada in Which fae are you?."
    )
  })
})

describe("quiz page description", () => {
  it("uses the hook line when it is set", () => {
    assert.equal(
      quizPageDescription({
        intro_text: "  Which court would claim you? ",
        book_title: "The Winter Court",
        quiz_title: "Which fae are you?",
      }),
      "Which court would claim you?"
    )
  })

  it("falls back when an older snapshot has no hook line", () => {
    assert.equal(
      quizPageDescription({
        book_title: "The Winter Court",
        quiz_title: "Which fae are you?",
      }),
      'Which character from "The Winter Court" are you? Take the Which fae are you? quiz.'
    )
  })
})

describe("share images", () => {
  it("accepts public https images and rejects private hosts", () => {
    assert.equal(
      isShareImageUrl(
        "https://abc.supabase.co/storage/v1/object/public/outcome-images/a.webp"
      ),
      true
    )
    assert.equal(isShareImageUrl("http://abc.supabase.co/a.png"), false)
    assert.equal(isShareImageUrl("https://127.0.0.1/a.png"), false)
    assert.equal(isShareImageUrl("https://169.254.169.254/latest"), false)
    assert.equal(
      isShareImageUrl("https://user:pass@cdn.example.com/a.png"),
      false
    )
    assert.equal(isShareImageUrl("not a url"), false)
  })

  it("collages portraits in outcome order and skips missing art", () => {
    const urls = collagePortraitUrls([
      ...snapshot().outcomes,
      {
        image_url: "http://insecure.example/a.png",
        sort_order: 3,
      },
      ...Array.from({ length: 6 }, (_, index) => ({
        image_url: `https://cdn.example.com/${index}.png`,
        sort_order: 10 + index,
      })),
    ])

    assert.deepEqual(urls.slice(0, 2), [
      "https://cdn.example.com/ada.png",
      "https://cdn.example.com/later.png",
    ])
    assert.equal(urls.length, 5)
    assert.equal(
      urls.some((url) => url.startsWith("http://")),
      false
    )
  })

  it("renders the quiz collage and the result card as pngs", async () => {
    const png = await sharp({
      create: { width: 12, height: 12, channels: 3, background: "#123456" },
    })
      .png()
      .toBuffer()
    const webp = await sharp({
      create: { width: 12, height: 12, channels: 3, background: "#654321" },
    })
      .webp()
      .toBuffer()
    const portrait = `data:image/png;base64,${png.toString("base64")}`
    const webpPortrait = `data:image/webp;base64,${webp.toString("base64")}`

    const collage = await buildQuizCollageCard({
      quizTitle: "Which fae are you?",
      bookTitle: "The Winter Court",
      portraitUrls: [portrait, webpPortrait],
    })
    assert.match(textOf(collage), /Which fae are you\?/)
    assert.match(textOf(collage), /The Winter Court/)
    const collagePng = await renderPng(collage)
    assert.equal(collagePng.subarray(0, 8).toString("hex"), PNG_SIGNATURE)

    const result = await buildOutcomeShareCard({
      outcomeName: "Ada",
      tagline: "the quiet one",
      quizTitle: "Which fae are you?",
      bookTitle: "The Winter Court",
      portraitUrl: webpPortrait,
    })
    const resultText = textOf(result)
    assert.match(resultText, /Ada/)
    assert.match(resultText, /the quiet one/)
    assert.match(resultText, /Which fae are you\?/)
    assert.match(resultText, /The Winter Court/)
    const resultPng = await renderPng(result)
    assert.equal(resultPng.subarray(0, 8).toString("hex"), PNG_SIGNATURE)

    const plain = await buildOutcomeShareCard({
      outcomeName: "Bea",
      tagline: "",
      quizTitle: "Which fae are you?",
      bookTitle: "The Winter Court",
      portraitUrl: null,
    })
    assert.match(textOf(plain), /Bea/)
    assert.doesNotMatch(textOf(plain), /the quiet one/)
    const plainPng = await renderPng(plain)
    assert.equal(plainPng.subarray(0, 8).toString("hex"), PNG_SIGNATURE)
  })
})

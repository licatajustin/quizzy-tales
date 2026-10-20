import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  comparableReaderLinkFields,
  normalizeHttpUrl,
  snapshotReaderLinks,
  snapshotWithReaderLinks,
} from "./reader-links.ts"

describe("normalizeHttpUrl", () => {
  it("stores an empty value as null", () => {
    assert.deepEqual(normalizeHttpUrl(null), { ok: true, url: null })
    assert.deepEqual(normalizeHttpUrl(undefined), { ok: true, url: null })
    assert.deepEqual(normalizeHttpUrl("   "), { ok: true, url: null })
  })

  it("accepts http and https links and keeps the author's URL", () => {
    assert.deepEqual(
      normalizeHttpUrl(" https://www.amazon.com/dp/123?tag=qt "),
      {
        ok: true,
        url: "https://www.amazon.com/dp/123?tag=qt",
      }
    )
    assert.deepEqual(normalizeHttpUrl("http://localhost:3000/book"), {
      ok: true,
      url: "http://localhost:3000/book",
    })
  })

  it("rejects anything that is not an http or https URL", () => {
    for (const value of [
      "amazon.com/book",
      "javascript:alert(1)",
      "data:text/html,hi",
      "ftp://files.example/book",
      "https://",
      `https://example.com/${"a".repeat(2000)}`,
    ]) {
      assert.deepEqual(normalizeHttpUrl(value), { ok: false }, value)
    }
  })
})

describe("snapshot reader links", () => {
  it("treats old snapshots that lack the fields as empty", () => {
    assert.deepEqual(snapshotReaderLinks({}), {
      bookUrl: null,
      newsletterUrl: null,
      authorDisplayName: null,
    })
    assert.deepEqual(comparableReaderLinkFields({}), {
      book_url: null,
      newsletter_url: null,
    })
    assert.deepEqual(
      comparableReaderLinkFields({}),
      comparableReaderLinkFields({
        book_url: null,
        newsletter_url: null,
      })
    )
  })

  it("drops unsafe URLs and blank author names", () => {
    assert.deepEqual(
      snapshotReaderLinks({
        book_url: "javascript:alert(1)",
        newsletter_url: "https://author.example/news",
        author_display_name: "  ",
      }),
      {
        bookUrl: null,
        newsletterUrl: "https://author.example/news",
        authorDisplayName: null,
      }
    )
  })

  it("keeps an existing author name when a later save cannot read one", () => {
    const next = snapshotWithReaderLinks(
      {
        quiz_title: "Which hero?",
        outcome_note: "leave me",
        author_display_name: "Ada Quinn",
      },
      {
        bookUrl: "https://www.amazon.com/dp/123",
        newsletterUrl: null,
        authorDisplayName: null,
      }
    )

    assert.equal(next.quiz_title, "Which hero?")
    assert.equal(next.outcome_note, "leave me")
    assert.equal(next.book_url, "https://www.amazon.com/dp/123")
    assert.equal(next.newsletter_url, null)
    assert.equal(next.author_display_name, "Ada Quinn")
  })

  it("counts a new book link as different from an old snapshot", () => {
    const previous = comparableReaderLinkFields({})
    const next = comparableReaderLinkFields({
      book_url: "https://www.amazon.com/dp/123",
    })

    assert.notDeepEqual(previous, next)
  })
})

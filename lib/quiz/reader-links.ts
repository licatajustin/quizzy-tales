const HTTP_URL_MAX_LENGTH = 2000

export type HttpUrlResult = { ok: true; url: string | null } | { ok: false }

export function normalizeHttpUrl(
  value: string | null | undefined
): HttpUrlResult {
  if (value == null) {
    return { ok: true, url: null }
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return { ok: true, url: null }
  }

  if (trimmed.length > HTTP_URL_MAX_LENGTH) {
    return { ok: false }
  }

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return { ok: false }
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false }
  }

  if (!parsed.hostname) {
    return { ok: false }
  }

  return { ok: true, url: trimmed }
}

export function readHttpUrl(value: unknown): string | null {
  if (typeof value !== "string") {
    return null
  }

  const normalized = normalizeHttpUrl(value)
  return normalized.ok ? normalized.url : null
}

export function readAuthorDisplayName(value: unknown): string | null {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export type ReaderLinkSnapshot = {
  book_url?: unknown
  newsletter_url?: unknown
  author_display_name?: unknown
}

export function snapshotReaderLinks(snapshot: ReaderLinkSnapshot) {
  return {
    bookUrl: readHttpUrl(snapshot.book_url),
    newsletterUrl: readHttpUrl(snapshot.newsletter_url),
    authorDisplayName: readAuthorDisplayName(snapshot.author_display_name),
  }
}

export function comparableReaderLinkFields(snapshot: ReaderLinkSnapshot) {
  const links = snapshotReaderLinks(snapshot)
  return {
    book_url: links.bookUrl,
    newsletter_url: links.newsletterUrl,
  }
}

export function snapshotWithReaderLinks<T extends ReaderLinkSnapshot>(
  snapshot: T,
  links: {
    bookUrl: string | null
    newsletterUrl: string | null
    authorDisplayName?: string | null
  }
): T & {
  book_url: string | null
  newsletter_url: string | null
  author_display_name: string | null
} {
  const authorDisplayName =
    readAuthorDisplayName(links.authorDisplayName) ??
    readAuthorDisplayName(snapshot.author_display_name)

  return {
    ...snapshot,
    book_url: readHttpUrl(links.bookUrl),
    newsletter_url: readHttpUrl(links.newsletterUrl),
    author_display_name: authorDisplayName,
  }
}

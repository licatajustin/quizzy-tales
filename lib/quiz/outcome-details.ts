export const OUTCOME_DETAIL_KINDS = ["text", "bullets", "chips"] as const

export type OutcomeDetailKind = (typeof OUTCOME_DETAIL_KINDS)[number]

export type OutcomeDetailSection =
  | { label: string; kind: "text"; value: string }
  | { label: string; kind: "bullets" | "chips"; value: string[] }

export type GeneratedDetailSection = {
  label: string
  kind: OutcomeDetailKind
  text: string
  items: string[]
}

const LIMITS = {
  sections: 12,
  label: 80,
  text: 800,
  items: 12,
  item: 80,
  tagline: 120,
} as const

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function cleanString(value: unknown, max: number) {
  if (typeof value !== "string") {
    return ""
  }

  return value.trim().slice(0, max)
}

function cleanItems(value: unknown) {
  const source = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/\r?\n/)
      : []
  const items: string[] = []

  for (const entry of source) {
    const text = cleanString(entry, LIMITS.item)
    if (!text) {
      continue
    }

    items.push(text)
    if (items.length >= LIMITS.items) {
      break
    }
  }

  return items
}

function isDetailKind(value: unknown): value is OutcomeDetailKind {
  return value === "text" || value === "bullets" || value === "chips"
}

export function normalizeOutcomeDetails(
  input: unknown
): OutcomeDetailSection[] {
  if (!Array.isArray(input)) {
    return []
  }

  const sections: OutcomeDetailSection[] = []

  for (const raw of input) {
    const record = asRecord(raw)
    if (!record || !isDetailKind(record.kind)) {
      continue
    }

    const label = cleanString(record.label, LIMITS.label)

    if (record.kind === "text") {
      const fromValue = typeof record.value === "string" ? record.value : ""
      const fromText = typeof record.text === "string" ? record.text : ""
      sections.push({
        label,
        kind: "text",
        value: cleanString(fromValue || fromText, LIMITS.text),
      })
    } else {
      const rawItems =
        record.items ??
        (Array.isArray(record.value) || typeof record.value === "string"
          ? record.value
          : [])
      sections.push({
        label,
        kind: record.kind,
        value: cleanItems(rawItems),
      })
    }

    if (sections.length >= LIMITS.sections) {
      break
    }
  }

  return sections
}

export function sectionHasVisibleContent(section: OutcomeDetailSection) {
  if (section.kind === "text") {
    return section.value.trim().length > 0
  }

  return section.value.length > 0
}

export function visibleOutcomeDetails(input: unknown) {
  return normalizeOutcomeDetails(input).filter(sectionHasVisibleContent)
}

export function normalizeTagline(value: unknown) {
  return cleanString(value, LIMITS.tagline)
}

export function sectionsFromGenerated(input: unknown) {
  return visibleOutcomeDetails(input)
}

export function detailSectionToGenerated(
  section: OutcomeDetailSection
): GeneratedDetailSection {
  if (section.kind === "text") {
    return {
      label: section.label,
      kind: "text",
      text: section.value,
      items: [],
    }
  }

  return {
    label: section.label,
    kind: section.kind,
    text: "",
    items: section.value,
  }
}

export function coerceSectionKind(
  section: OutcomeDetailSection,
  kind: OutcomeDetailKind
): OutcomeDetailSection {
  if (section.kind === kind) {
    return section
  }

  if (kind === "text") {
    const value =
      section.kind === "text" ? section.value : section.value.join("\n")
    return { label: section.label, kind: "text", value }
  }

  const items =
    section.kind === "text"
      ? section.value
          .split(/\r?\n/)
          .map((item) => item.trim())
          .filter(Boolean)
      : section.value

  return {
    label: section.label,
    kind,
    value: items.length > 0 ? items : [""],
  }
}

export function mergeGeneratedProfile(
  existing: {
    description: string
    tagline: string
    details: OutcomeDetailSection[]
  },
  generated: {
    description?: string
    tagline?: string
    details?: unknown
  }
) {
  const description = generated.description?.trim() || existing.description
  const tagline =
    normalizeTagline(generated.tagline) || normalizeTagline(existing.tagline)
  const details = sectionsFromGenerated(generated.details)

  return {
    description,
    tagline,
    details: details.length > 0 ? details : existing.details,
  }
}

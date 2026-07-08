export const OUTCOME_IMAGE_STYLES = [
  {
    id: "editorial-portrait",
    label: "Editorial portrait",
    prompt:
      "Editorial literary portrait, warm studio lighting, refined magazine cover aesthetic",
  },
  {
    id: "painterly-book-cover",
    label: "Painterly book cover",
    prompt:
      "Painterly book cover illustration, rich brushwork, cinematic composition",
  },
  {
    id: "cinematic-fantasy",
    label: "Cinematic fantasy",
    prompt:
      "Cinematic fantasy character portrait, dramatic lighting, epic atmosphere",
  },
  {
    id: "soft-watercolor",
    label: "Soft watercolor",
    prompt:
      "Soft watercolor character portrait, gentle washes, storybook warmth",
  },
  {
    id: "graphic-novel",
    label: "Graphic novel",
    prompt:
      "Graphic novel character portrait, bold ink lines, limited color palette",
  },
  {
    id: "photoreal-study",
    label: "Photoreal character study",
    prompt:
      "Photorealistic character study portrait, natural light, subtle film grain",
  },
] as const

export type OutcomeImageStyleId = (typeof OUTCOME_IMAGE_STYLES)[number]["id"]

export function getOutcomeImageStyle(styleId: OutcomeImageStyleId) {
  return OUTCOME_IMAGE_STYLES.find((style) => style.id === styleId)
}

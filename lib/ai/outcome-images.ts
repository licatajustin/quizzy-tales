import { randomUUID } from "node:crypto"

const OUTCOME_IMAGES_BUCKET = "outcome-images"

function normalizeImageExtension(extension: "jpg" | "jpeg" | "png" | "webp") {
  return extension === "jpeg" ? "jpg" : extension
}

export function buildOutcomeImagePath(
  authorId: string,
  quizId: string,
  outcomeId: string,
  extension: "jpg" | "jpeg" | "png" | "webp"
) {
  const normalizedExtension = normalizeImageExtension(extension)
  return `authors/${authorId}/quizzes/${quizId}/outcomes/${outcomeId}/${randomUUID()}.${normalizedExtension}`
}

export function buildCoverImagePath(
  authorId: string,
  quizId: string,
  extension: "jpg" | "jpeg" | "png" | "webp"
) {
  const normalizedExtension = normalizeImageExtension(extension)
  return `authors/${authorId}/quizzes/${quizId}/cover/${randomUUID()}.${normalizedExtension}`
}

export function getOutcomeImagesBucket() {
  return OUTCOME_IMAGES_BUCKET
}

export function getPublicStorageUrl(supabaseUrl: string, path: string) {
  return `${supabaseUrl}/storage/v1/object/public/${OUTCOME_IMAGES_BUCKET}/${path}`
}

export function storagePathFromPublicUrl(imageUrl: string) {
  const marker = `/storage/v1/object/public/${OUTCOME_IMAGES_BUCKET}/`
  const index = imageUrl.indexOf(marker)

  if (index === -1) {
    return null
  }

  return imageUrl.slice(index + marker.length)
}

export function detectImageExtension(
  contentType: string | null | undefined
): "jpg" | "png" | "webp" | null {
  switch (contentType) {
    case "image/jpeg":
      return "jpg"
    case "image/png":
      return "png"
    case "image/webp":
      return "webp"
    default:
      return null
  }
}

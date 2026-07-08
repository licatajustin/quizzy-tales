import type { SupabaseClient } from "@supabase/supabase-js"

import {
  buildCoverImagePath,
  buildOutcomeImagePath,
  getOutcomeImagesBucket,
  getPublicStorageUrl,
} from "@/lib/ai/outcome-images"
import { getSupabaseUrl } from "@/lib/supabase/env"

function isDataUrl(value: string) {
  return value.startsWith("data:")
}

function dataUrlToBytes(dataUrl: string) {
  const [header, base64] = dataUrl.split(",")
  const mimeMatch = header.match(/data:(.*?);/)
  const mime = mimeMatch?.[1] ?? "image/webp"
  const extension =
    mime === "image/jpeg"
      ? "jpg"
      : mime === "image/png"
        ? "png"
        : "webp"

  return {
    bytes: Buffer.from(base64, "base64"),
    contentType: mime,
    extension: extension as "jpg" | "png" | "webp",
  }
}

async function uploadDataUrlImage(
  supabase: SupabaseClient,
  authorId: string,
  quizId: string,
  outcomeId: string | null,
  dataUrl: string,
  kind: "cover" | "outcome"
) {
  const { bytes, contentType, extension } = dataUrlToBytes(dataUrl)

  const storagePath =
    kind === "cover"
      ? buildCoverImagePath(authorId, quizId, extension)
      : buildOutcomeImagePath(authorId, quizId, outcomeId!, extension)

  const { error } = await supabase.storage
    .from(getOutcomeImagesBucket())
    .upload(storagePath, bytes, { contentType, upsert: false })

  if (error) {
    throw new Error(error.message)
  }

  return getPublicStorageUrl(getSupabaseUrl(), storagePath)
}

export async function resolveBuilderImageUrl(
  supabase: SupabaseClient,
  authorId: string,
  quizId: string,
  imageUrl: string,
  outcomeId?: string
) {
  if (!imageUrl.trim()) {
    return null
  }

  if (!isDataUrl(imageUrl)) {
    return imageUrl
  }

  return uploadDataUrlImage(
    supabase,
    authorId,
    quizId,
    outcomeId ?? null,
    imageUrl,
    outcomeId ? "outcome" : "cover"
  )
}

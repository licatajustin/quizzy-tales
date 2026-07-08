import type { SupabaseClient } from "@supabase/supabase-js"

import { getOutcomeImagesBucket } from "@/lib/ai/outcome-images"

const REMOVE_BATCH_SIZE = 100

async function listStoragePaths(
  supabase: SupabaseClient,
  bucket: string,
  prefix: string
): Promise<string[]> {
  const { data, error } = await supabase.storage.from(bucket).list(prefix, {
    limit: 1000,
  })

  if (error || !data?.length) {
    return []
  }

  const paths: string[] = []

  for (const item of data) {
    const itemPath = prefix ? `${prefix}/${item.name}` : item.name

    if (item.id === null) {
      paths.push(...(await listStoragePaths(supabase, bucket, itemPath)))
      continue
    }

    paths.push(itemPath)
  }

  return paths
}

export async function deleteAuthorStorage(
  supabase: SupabaseClient,
  authorId: string
) {
  const bucket = getOutcomeImagesBucket()
  const prefix = `authors/${authorId}`
  const paths = await listStoragePaths(supabase, bucket, prefix)

  for (let index = 0; index < paths.length; index += REMOVE_BATCH_SIZE) {
    const batch = paths.slice(index, index + REMOVE_BATCH_SIZE)
    await supabase.storage.from(bucket).remove(batch)
  }
}

import { revalidatePath, revalidateTag } from "next/cache"

export function revalidateLiveQuizPaths(quizId: string, slug?: string) {
  revalidatePath(`/dashboard/quizzes/${quizId}`)
  revalidatePath(`/dashboard/quizzes/${quizId}/preview`)

  if (slug) {
    revalidatePath(`/q/${slug}`)
    revalidateTag(`quiz-${slug}`, "max")
  }
}

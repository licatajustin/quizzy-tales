import { Skeleton } from "@/components/ui/skeleton"

export default function PublicQuizLoading() {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col justify-center gap-8 px-6 py-12">
      <Skeleton className="mx-auto aspect-[4/3] w-full max-w-md rounded-2xl" />
      <div className="mx-auto w-full max-w-md space-y-3">
        <Skeleton className="mx-auto h-4 w-32" />
        <Skeleton className="mx-auto h-9 w-full max-w-sm" />
        <Skeleton className="mx-auto h-4 w-48" />
      </div>
      <Skeleton className="mx-auto h-11 w-40 rounded-full" />
    </div>
  )
}

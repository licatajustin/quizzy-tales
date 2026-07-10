"use client"

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 py-16 text-center font-sans">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="max-w-md text-sm text-neutral-600">
          A critical error occurred. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="rounded-full border border-neutral-300 px-4 py-2 text-sm"
        >
          Try again
        </button>
      </body>
    </html>
  )
}

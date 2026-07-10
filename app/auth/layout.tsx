import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-6 py-12">
      <Link
        href="/"
        className="mb-8 text-xl font-semibold tracking-tight text-foreground"
      >
        QuizzyTales
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}

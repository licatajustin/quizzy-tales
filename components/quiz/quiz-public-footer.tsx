import Link from "next/link"

import { SIGN_UP_PATH } from "@/components/marketing/content"

export function QuizPublicFooter() {
  return (
    <footer className="border-t border-border/60 bg-muted/20">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-2 px-6 py-8 text-center text-sm text-muted-foreground sm:flex-row sm:justify-between sm:text-left">
        <p>
          Made with{" "}
          <Link href="/" className="font-medium text-foreground hover:underline">
            QuizzyTales
          </Link>
        </p>
        <Link
          href={SIGN_UP_PATH}
          className="font-medium text-foreground hover:underline"
        >
          Create your own book quiz
        </Link>
      </div>
    </footer>
  )
}

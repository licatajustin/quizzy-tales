import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Authentication failed
          </h1>
          <p className="text-sm text-muted-foreground">
            Something went wrong while signing you in. Please try again.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild className="rounded-full">
            <Link href="/auth/login">Try again</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/">Back home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

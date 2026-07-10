import Link from "next/link"

import { ThemeToggle } from "@/components/marketing/theme-toggle"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  LOGIN_PATH,
  marketingNavLinks,
  SIGN_UP_PATH,
} from "@/components/marketing/content"

type SiteHeaderProps = {
  className?: string
}

export function SiteHeader({ className }: SiteHeaderProps) {
  return (
    <header
      className={cn(
        "mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 rounded-2xl border border-border/50 bg-background/60 px-4 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-background/45 dark:border-white/10 dark:bg-background/35",
        className
      )}
    >
      <Link
        href="/"
        className="text-lg font-semibold tracking-tight text-foreground"
      >
        QuizzyTales
      </Link>

      <nav className="hidden items-center gap-6 md:flex">
        {marketingNavLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <ThemeToggle />
        <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
          <Link href={LOGIN_PATH}>Sign in</Link>
        </Button>
        <Button asChild size="sm" className="rounded-full">
          <Link href={SIGN_UP_PATH}>Get started</Link>
        </Button>
      </div>
    </header>
  )
}

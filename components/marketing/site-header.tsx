"use client"

import Link from "next/link"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

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
  const { resolvedTheme, setTheme } = useTheme()

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
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative rounded-full"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          <Sun className="size-4 transition-all dark:scale-0 dark:opacity-0" />
          <Moon className="absolute size-4 scale-0 opacity-0 transition-all dark:scale-100 dark:opacity-100" />
        </Button>
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

"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
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
  )
}

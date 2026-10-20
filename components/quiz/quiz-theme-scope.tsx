"use client"

import { createContext, useContext, type ReactNode } from "react"

import { quizThemeAttrs, type QuizThemeAttrs } from "@/lib/quiz/theme-style"
import { cn } from "@/lib/utils"

const QuizThemeContext = createContext<QuizThemeAttrs | null>(null)

export function useQuizThemeAttrs() {
  return useContext(QuizThemeContext)
}

type QuizThemeScopeProps = {
  theme?: unknown
  className?: string
  children: ReactNode
}

export function QuizThemeScope({
  theme,
  className,
  children,
}: QuizThemeScopeProps) {
  const attrs = quizThemeAttrs(theme)

  if (!attrs) {
    return <div className={className}>{children}</div>
  }

  return (
    <QuizThemeContext.Provider value={attrs}>
      <div
        className={cn(
          attrs["data-quiz-scheme"] && "bg-background text-foreground",
          className
        )}
        {...attrs}
      >
        {children}
      </div>
    </QuizThemeContext.Provider>
  )
}

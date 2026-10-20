import { Cinzel, Fraunces, Outfit } from "next/font/google"

import { cn } from "@/lib/utils"

// Family names match QUIZ_FONT_FAMILIES in theme.ts.
const quizSerif = Fraunces({
  subsets: ["latin"],
  variable: "--font-quiz-serif",
  display: "swap",
  preload: false,
})

const quizStory = Cinzel({
  subsets: ["latin"],
  variable: "--font-quiz-story",
  display: "swap",
  preload: false,
})

const quizModern = Outfit({
  subsets: ["latin"],
  variable: "--font-quiz-modern",
  display: "swap",
  preload: false,
})

export const quizFontVariables = cn(
  quizSerif.variable,
  quizStory.variable,
  quizModern.variable
)

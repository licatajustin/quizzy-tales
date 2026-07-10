import type { Metadata } from "next"

import { LandingPage } from "@/components/marketing/landing-page"

export const metadata: Metadata = {
  title: "Personality quizzes for authors",
  description:
    'Create book-themed "Which character are you?" quizzes your readers will share.',
  alternates: {
    canonical: "/",
  },
}

export default function Page() {
  return <LandingPage />
}

import type { LucideIcon } from "lucide-react"
import {
  BookOpen,
  ChartColumnIncreasing,
  Share2,
  Wand2,
} from "lucide-react"

import { featureItems } from "@/lib/marketing/content-data"

export {
  SIGN_UP_PATH,
  LOGIN_PATH,
  marketingNavLinks,
  socialProofStats,
  steps,
  pricingPlans,
  faqs,
  quizPreviewAnswers,
} from "@/lib/marketing/content-data"
export type { PricingPlan } from "@/lib/marketing/content-data"

const featureIcons = [Wand2, BookOpen, Share2, ChartColumnIncreasing] as const

export type Feature = {
  icon: LucideIcon
  title: string
  description: string
}

export const features: Feature[] = featureItems.map((feature, index) => ({
  ...feature,
  icon: featureIcons[index],
}))

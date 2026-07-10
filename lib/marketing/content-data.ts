export const SIGN_UP_PATH = "/auth/sign-up"
export const LOGIN_PATH = "/auth/login"

export const marketingNavLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
] as const

export const socialProofStats = [
  { stat: "3 min", label: "Average time to first draft" },
  { stat: "4×", label: "More shares vs. static book links" },
  { stat: "0", label: "Reader sign-ups required" },
] as const

export const featureItems = [
  {
    title: "Drafts that read like your world",
    description:
      "Generate outcomes and questions from your synopsis in one pass. Revise with plain English, not spreadsheets.",
  },
  {
    title: "Built for authors, not engineers",
    description:
      "Weighted scoring stays understandable. Outcomes and answers stay connected so you never lose the thread.",
  },
  {
    title: "Made to go viral",
    description:
      "Readers get a character result worth posting. One-tap sharing to social, plus a link they'll send to book clubs.",
  },
  {
    title: "See what resonates",
    description:
      "Track starts, completions, shares, and which characters win. Know what's working before your next launch.",
  },
] as const

export const steps = [
  {
    step: "01",
    title: "Describe your book",
    description:
      "Add your title, synopsis, and tone. Paste a blurb — we handle the quiz structure.",
  },
  {
    step: "02",
    title: "Shape your characters",
    description:
      "Edit outcomes, questions, and answers in a writing-first editor. Tune scoring when you're ready.",
  },
  {
    step: "03",
    title: "Publish and share",
    description:
      "Get a shareable link at your own URL. Readers take the quiz anonymously — no sign-up wall.",
  },
] as const

export type PricingPlan = {
  name: string
  description: string
  price: string
  interval: string
  perks: string[]
  cta: string
  highlighted?: boolean
  badge?: string
}

export const pricingPlans: PricingPlan[] = [
  {
    name: "Drafts",
    description: "Build unlimited quizzes for free",
    price: "$0",
    interval: "/forever",
    perks: ["Unlimited draft quizzes", "Included credits while building", "Preview mode"],
    cta: "Start creating",
  },
  {
    name: "Author plan",
    description: "$15/mo includes 1 live quiz + full builder",
    price: "$15",
    interval: "/month",
    perks: [
      "1 live quiz slot included",
      "Full quiz builder & revision",
      "Engagement analytics",
      "Extra live quizzes +$15/mo each",
    ],
    cta: "Start your plan",
    highlighted: true,
    badge: "Most popular",
  },
]

export const faqs = [
  {
    question: "Do my readers need an account?",
    answer:
      "No. Readers take published quizzes anonymously at your public link. Only authors sign up to create and manage quizzes.",
  },
  {
    question: "Can I edit a quiz after publishing?",
    answer:
      "Yes. You keep editing your draft anytime. When you're ready, publish changes to update what readers see — without breaking your link.",
  },
  {
    question: "How does quiz drafting work?",
    answer:
      "Paste your book synopsis and pick a tone. QuizzyTales drafts character outcomes, questions, and weighted answers you can refine in the editor. Included credits help you build before going live.",
  },
  {
    question: "How does pricing work?",
    answer:
      "Drafts are free with a small set of included credits. The author plan is $15/month and includes 1 live quiz slot plus full builder access — subscribe anytime, publish when ready. Each additional simultaneous live quiz is +$15/month.",
  },
] as const

export const quizPreviewAnswers = [
  "Take the risk — fortune favors the bold",
  "Ask someone you trust first",
  "Walk away. Some doors stay closed.",
  "Negotiate until the terms suit you",
] as const

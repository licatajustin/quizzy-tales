import type { OutcomePointShare } from "@/lib/quiz/scoring"
import type { PublishedOutcome, PublishedQuizSnapshot } from "@/lib/quiz/types"

const portraitSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800">
  <rect width="800" height="800" fill="#f4efe4"/>
  <circle cx="400" cy="430" r="250" fill="#efe2be"/>
  <path d="M118 250c78 46 92 28 168-8" fill="none" stroke="#c8962e" stroke-width="16" stroke-linecap="round"/>
  <path d="M96 318c110 42 120 24 214-6" fill="none" stroke="#ddb34a" stroke-width="12" stroke-linecap="round"/>
  <path d="M520 176c74 58 86 40 156 8" fill="none" stroke="#c8962e" stroke-width="14" stroke-linecap="round"/>
  <circle cx="400" cy="318" r="78" fill="#2b2724"/>
  <path d="M248 690c28-168 276-168 304 0H248z" fill="#2b2724"/>
</svg>`

export const previewPortraitUrl = `data:image/svg+xml,${encodeURIComponent(portraitSvg)}`

export const previewShares: OutcomePointShare[] = [
  { id: "wind", name: "Wind", points: 10, percent: 50 },
  { id: "fire", name: "Fire", points: 6, percent: 30 },
  { id: "water", name: "Water", points: 3, percent: 15 },
  { id: "earth", name: "Earth", points: 1, percent: 5 },
]

export const windOutcome: PublishedOutcome = {
  id: "wind",
  name: "Wind",
  sort_order: 0,
  image_url: previewPortraitUrl,
  tagline: "The one who leaves the window open",
  description:
    "You read a room by its weather. People trust you with the plan because you change it quietly, before anyone has to ask.",
  details: [
    {
      label: "Core",
      kind: "text",
      value:
        "Open sky, steady hands, and a talent for leaving at the right time.",
    },
    {
      label: "Strength",
      kind: "text",
      value: "You notice the shift before it has a name.",
    },
    {
      label: "Shadow",
      kind: "text",
      value: "You can vanish from a life you still care about.",
    },
    {
      label: "Keepsake",
      kind: "text",
      value: "A map folded until the creases know the way.",
    },
    {
      label: "How you move",
      kind: "bullets",
      value: [
        "Take the long way if the air is better",
        "Speak after the room exhales",
        "Trade certainty for a clearer view",
      ],
    },
    {
      label: "What steadies you",
      kind: "bullets",
      value: [
        "An open window",
        "One honest friend",
        "Work you can leave unfinished",
      ],
    },
    {
      label: "Element",
      kind: "chips",
      value: ["Air", "Horizon", "Salt"],
    },
    {
      label: "Drawn to",
      kind: "chips",
      value: ["High places", "Unsent letters", "Dawn"],
    },
    {
      label: "Wary of",
      kind: "chips",
      value: ["Closed rooms", "Ultimatums", "Crowds"],
    },
    {
      label: "Alongside",
      kind: "chips",
      value: ["The cartographer", "The night watch", "The hearth"],
    },
  ],
}

export const sparseOutcome: PublishedOutcome = {
  id: "fire",
  name: "Fire",
  sort_order: 1,
  image_url: null,
  tagline: "   ",
  description: "\n",
  details: [
    { label: "Empty", kind: "text", value: "   " },
    { label: "Hidden", kind: "bullets", value: [] },
    { label: "None", kind: "chips", value: ["  "] },
  ],
}

const fireOutcome: PublishedOutcome = {
  id: "fire",
  name: "Fire",
  sort_order: 1,
  image_url: null,
  tagline: "The one who keeps the hearth",
  description: "You arrive with warmth and leave a little smoke.",
  details: [],
}

const waterOutcome: PublishedOutcome = {
  id: "water",
  name: "Water",
  sort_order: 2,
  image_url: null,
  tagline: "",
  description: "You take the shape the day asks for.",
  details: [],
}

const earthOutcome: PublishedOutcome = {
  id: "earth",
  name: "Earth",
  sort_order: 3,
  image_url: null,
  tagline: "",
  description: "You stay, and the story has somewhere to stand.",
  details: [],
}

export const previewQuiz: PublishedQuizSnapshot = {
  quiz_title: "Which current are you?",
  book_title: "The Open Window",
  cover_image_url: null,
  published_at: "2026-01-01T00:00:00.000Z",
  outcomes: [windOutcome, fireOutcome, waterOutcome, earthOutcome],
  questions: [
    {
      id: "q1",
      question_text: "A storm is coming and the house is still. You…",
      allow_multiple: false,
      sort_order: 0,
      answers: [
        {
          id: "q1a",
          answer_text: "Open the window and listen",
          sort_order: 0,
          weights: { wind: 6, fire: 4, water: 0, earth: 0 },
        },
        {
          id: "q1b",
          answer_text: "Light the hearth",
          sort_order: 1,
          weights: { wind: 0, fire: 6, water: 1, earth: 2 },
        },
      ],
    },
    {
      id: "q2",
      question_text: "Someone asks you to choose a road.",
      allow_multiple: false,
      sort_order: 1,
      answers: [
        {
          id: "q2a",
          answer_text: "Take the one with a view",
          sort_order: 0,
          weights: { wind: 4, fire: 2, water: 3, earth: 1 },
        },
        {
          id: "q2b",
          answer_text: "Stay with the stone",
          sort_order: 1,
          weights: { wind: 0, fire: 1, water: 2, earth: 6 },
        },
      ],
    },
  ],
}

export const restoreQuiz: PublishedQuizSnapshot = {
  ...previewQuiz,
  random_question_subset: true,
  questions_per_attempt: 1,
}

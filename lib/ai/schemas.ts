import { z } from "zod"

import type { OutcomeDetailSection } from "@/lib/quiz/outcome-details"

export const generatedDetailSectionSchema = z.object({
  label: z.string().describe("Short heading chosen for this result"),
  kind: z.enum(["text", "bullets", "chips"]),
  text: z
    .string()
    .describe(
      "One or two sentences when kind is text. Empty string otherwise."
    ),
  items: z
    .array(z.string())
    .describe(
      "Short phrases when kind is bullets or chips. Empty array otherwise."
    ),
})

const weightSchema = z.object({
  outcome_id: z
    .string()
    .describe("Temporary outcome id from the outcomes array, e.g. outcome_1"),
  value: z.number().min(0).max(10),
})

const generatedAnswerSchema = z.object({
  answer_text: z.string(),
  weights: z.array(weightSchema).min(1),
})

const generatedQuestionSchema = z.object({
  question_text: z.string(),
  allow_multiple: z
    .boolean()
    .describe(
      "Whether the reader can select up to 2 answers. False means one answer."
    ),
  answers: z.array(generatedAnswerSchema).min(2).max(6),
})

const generatedOutcomeSchema = z.object({
  id: z
    .string()
    .describe("Stable temporary id used in answer weights, e.g. outcome_1"),
  name: z.string(),
  tagline: z
    .string()
    .describe("Short epithet shown under the name. Do not repeat the name."),
  description: z
    .string()
    .describe("Summary a reader sees first, usually two sentences."),
  details: z
    .array(generatedDetailSectionSchema)
    .max(8)
    .describe("Profile sections that help a reader understand this result."),
})

export const generatedQuizModelSchema = z.object({
  quiz_title: z.string(),
  outcomes: z.array(generatedOutcomeSchema).min(2).max(10),
  questions: z.array(generatedQuestionSchema).min(3).max(20),
})

export type GeneratedQuizModel = z.infer<typeof generatedQuizModelSchema>

export type GeneratedQuiz = {
  quiz_title: string
  outcomes: {
    id: string
    name: string
    description: string
    tagline: string
    details: OutcomeDetailSection[]
  }[]
  questions: GeneratedQuizModel["questions"]
}

export const quizRevisionPatchModelSchema = z.object({
  summary: z.string(),
  quiz_title: z.string(),
  outcomes: z.array(generatedOutcomeSchema),
  questions: z.array(generatedQuestionSchema),
})

export type QuizRevisionPatchModel = z.infer<
  typeof quizRevisionPatchModelSchema
>

export type QuizRevisionPatch = {
  summary: string
  quiz_title: string
  outcomes: GeneratedQuiz["outcomes"]
  questions: GeneratedQuiz["questions"]
}

export const generateQuizRequestSchema = z.object({
  book_title: z.string().min(1),
  synopsis: z.string().min(20),
  author_name: z.string().optional(),
  outcomes: z.array(z.string().min(1)).min(2).max(10).optional(),
  book_research: z.string().optional(),
  run_book_research: z.boolean().optional(),
  stream: z.boolean().optional(),
  character_count: z.number().int().min(3).max(6).default(4),
  quiz_title: z.string().optional(),
  tone: z.enum(["playful", "thoughtful", "dramatic", "whimsical"]).optional(),
  question_style: z.enum(["scenario", "preference", "mixed"]).optional(),
  include_descriptions: z.boolean().optional(),
})

export const reviseQuizRequestSchema = z.object({
  quiz_id: z.string().uuid(),
  instruction: z.string().min(3).max(4000),
})

export const generateOutcomeDetailsRequestSchema = z.object({
  quiz_id: z.string().uuid(),
  outcome_id: z.string().uuid().optional(),
})

const outcomeProfileTargetSchema = z.object({
  id: z
    .string()
    .describe("The outcome id given in the prompt. Copy it exactly."),
  tagline: z.string(),
  description: z.string(),
  details: z.array(generatedDetailSectionSchema).max(8),
})

export const generatedOutcomeProfilesModelSchema = z.object({
  outcomes: z.array(outcomeProfileTargetSchema).min(1),
})

export type GeneratedOutcomeProfilesModel = z.infer<
  typeof generatedOutcomeProfilesModelSchema
>

export const generatePortraitRequestSchema = z.object({
  quiz_id: z.string().uuid(),
  outcome_id: z.string().uuid(),
  style_id: z.enum([
    "editorial-portrait",
    "painterly-book-cover",
    "cinematic-fantasy",
    "soft-watercolor",
    "graphic-novel",
    "photoreal-study",
  ]),
  art_direction: z.string().max(500).optional(),
})

export const bookResearchSchema = z.object({
  found: z
    .boolean()
    .describe(
      "True when you can provide useful book context from your knowledge or the author's synopsis"
    ),
  title: z.string(),
  authors: z.array(z.string()).optional(),
  description: z
    .string()
    .describe("Plot summary and key details in 2-4 sentences"),
  genre: z.string().optional(),
  themes: z.array(z.string()).optional(),
  main_characters: z.array(z.string()).optional(),
})

export type BookResearch = z.infer<typeof bookResearchSchema>

export const researchBookRequestSchema = z.object({
  book_title: z.string().min(1),
  author_name: z.string().optional(),
  synopsis: z.string().min(20).optional(),
})

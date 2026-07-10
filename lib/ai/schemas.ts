import { z } from "zod"

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
    .describe("Whether the reader can select multiple answers"),
  answers: z.array(generatedAnswerSchema).min(2).max(6),
})

const generatedOutcomeSchema = z.object({
  id: z
    .string()
    .describe("Stable temporary id used in answer weights, e.g. outcome_1"),
  name: z.string(),
  description: z.string(),
})

export const generatedQuizSchema = z.object({
  quiz_title: z.string(),
  outcomes: z.array(generatedOutcomeSchema).min(2).max(10),
  questions: z.array(generatedQuestionSchema).min(3).max(20),
})

export type GeneratedQuiz = z.infer<typeof generatedQuizSchema>

export const quizRevisionPatchSchema = z.object({
  summary: z.string(),
  quiz_title: z.string(),
  outcomes: z.array(generatedOutcomeSchema),
  questions: z.array(generatedQuestionSchema),
})

export type QuizRevisionPatch = z.infer<typeof quizRevisionPatchSchema>

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
  tone: z
    .enum(["playful", "thoughtful", "dramatic", "whimsical"])
    .optional(),
  question_style: z.enum(["scenario", "preference", "mixed"]).optional(),
  include_descriptions: z.boolean().optional(),
})

export const reviseQuizRequestSchema = z.object({
  quiz_id: z.string().uuid(),
  instruction: z.string().min(3).max(4000),
})

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

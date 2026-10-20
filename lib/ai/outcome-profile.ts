import type {
  GeneratedOutcomeProfilesModel,
  GeneratedQuiz,
  GeneratedQuizModel,
  QuizRevisionPatch,
  QuizRevisionPatchModel,
} from "@/lib/ai/schemas"
import {
  normalizeTagline,
  sectionsFromGenerated,
  type OutcomeDetailSection,
} from "@/lib/quiz/outcome-details"

function toStoredOutcome(outcome: {
  id: string
  name: string
  description: string
  tagline?: string
  details?: unknown
}): GeneratedQuiz["outcomes"][number] {
  return {
    id: outcome.id,
    name: outcome.name.trim(),
    description: outcome.description.trim(),
    tagline: normalizeTagline(outcome.tagline),
    details: sectionsFromGenerated(outcome.details),
  }
}

export function toGeneratedQuiz(model: GeneratedQuizModel): GeneratedQuiz {
  return {
    quiz_title: model.quiz_title.trim(),
    outcomes: model.outcomes.map(toStoredOutcome),
    questions: model.questions,
  }
}

export function toQuizRevisionPatch(
  model: QuizRevisionPatchModel
): QuizRevisionPatch {
  return {
    summary: model.summary.trim(),
    quiz_title: model.quiz_title.trim(),
    outcomes: model.outcomes.map(toStoredOutcome),
    questions: model.questions,
  }
}

export function toStoredProfiles(model: GeneratedOutcomeProfilesModel): {
  id: string
  description: string
  tagline: string
  details: OutcomeDetailSection[]
}[] {
  return model.outcomes.map((outcome) => ({
    id: outcome.id.trim(),
    description: outcome.description.trim(),
    tagline: normalizeTagline(outcome.tagline),
    details: sectionsFromGenerated(outcome.details),
  }))
}

type GenerateQuizPromptInput = {
  bookTitle: string
  synopsis: string
  characterCount: number
  quizTitle?: string
  tone?: "playful" | "thoughtful" | "dramatic" | "whimsical"
  questionStyle?: "scenario" | "preference" | "mixed"
  includeDescriptions?: boolean
  authorDisplayName?: string
}

export function buildGenerateQuizPrompt(input: GenerateQuizPromptInput) {
  const tone = input.tone ?? "thoughtful"
  const questionStyle = input.questionStyle ?? "mixed"
  const includeDescriptions = input.includeDescriptions ?? true
  const quizTitle =
    input.quizTitle?.trim() || `Which character from ${input.bookTitle} are you?`

  return `You are an expert quiz designer for book authors. Create a polished "Which character are you?" personality quiz.

Book title: ${input.bookTitle}
Synopsis: ${input.synopsis}
${input.authorDisplayName ? `Author: ${input.authorDisplayName}` : ""}

Requirements:
- Quiz title: "${quizTitle}"
- Create exactly ${input.characterCount} distinct character outcomes grounded in the book.
- Tone: ${tone}
- Question style: ${questionStyle} (scenario = situational choices, preference = taste/personality, mixed = blend both)
- Include outcome descriptions: ${includeDescriptions ? "yes, 2-3 sentences each" : "keep descriptions to one short sentence"}
- Create 5-8 questions with 3-4 answers each.
- Set allow_multiple to false unless the question genuinely supports multiple selections.
- Every answer must include weighted scores (0-10) for EVERY outcome id.
- Use stable temporary outcome ids like outcome_1, outcome_2, etc.
- Make scoring balanced so every outcome is reachable with thoughtful answers.
- Avoid spoilers beyond what the synopsis implies.
- Write in clear, engaging language suitable for readers discovering the book.

Return structured JSON only.`
}

type ReviseQuizPromptInput = {
  bookTitle: string
  quizTitle: string
  instruction: string
  currentQuizJson: string
}

export function buildReviseQuizPrompt(input: ReviseQuizPromptInput) {
  return `You are revising a book-themed personality quiz for an author.

Book title: ${input.bookTitle}
Quiz title: ${input.quizTitle}

Current quiz JSON:
${input.currentQuizJson}

Author instruction:
${input.instruction}

Return a concise summary of changes and an updated quiz patch.
Always return quiz_title (repeat the current title if unchanged).
If only the title or metadata changes, return empty outcomes and questions arrays.
If outcomes or questions change, return the FULL updated arrays (not partial diffs).
Keep existing outcome ids (outcome_1, outcome_2, ...) for unchanged characters so portraits can be preserved.
Each question must include allow_multiple (true or false).
Use the same outcome id scheme (outcome_1, outcome_2, ...) and keep weights aligned to those ids.
Preserve quality: balanced scoring, 2+ answers per question, engaging copy.`
}

type PortraitPromptInput = {
  bookTitle: string
  outcomeName: string
  outcomeDescription: string
  stylePrompt: string
  artDirection?: string
}

export function buildPortraitPrompt(input: PortraitPromptInput) {
  return `Character portrait for a book personality quiz result.

Book: ${input.bookTitle}
Character: ${input.outcomeName}
Character description: ${input.outcomeDescription}
Visual style: ${input.stylePrompt}
${input.artDirection ? `Additional art direction: ${input.artDirection}` : ""}

Create a single character portrait suitable as a quiz result image. No text, logos, or watermarks. Focus on the character's personality and mood.`
}

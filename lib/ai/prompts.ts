type GenerateQuizPromptInput = {
  bookTitle: string
  synopsis: string
  characterCount: number
  quizTitle?: string
  authorName?: string
  authorDisplayName?: string
  outcomes?: string[]
  bookResearch?: string
  tone?: "playful" | "thoughtful" | "dramatic" | "whimsical"
  questionStyle?: "scenario" | "preference" | "mixed"
  includeDescriptions?: boolean
}

export function buildGenerateQuizPrompt(input: GenerateQuizPromptInput) {
  const tone = input.tone ?? "thoughtful"
  const questionStyle = input.questionStyle ?? "preference"
  const includeDescriptions = input.includeDescriptions ?? true
  const quizTitle =
    input.quizTitle?.trim() || `Which character from ${input.bookTitle} are you?`
  const authorName = input.authorName?.trim() || input.authorDisplayName?.trim()

  const outcomeInstruction = input.outcomes?.length
    ? `- Use these author-defined outcomes (one per line): ${input.outcomes.map((o) => `"${o}"`).join(", ")}`
    : `- Create exactly ${input.characterCount} distinct character outcomes grounded in the book.`

  return `You are an expert quiz designer for book authors. Create a polished "Which character are you?" personality quiz.

Book title: ${input.bookTitle}
Synopsis: ${input.synopsis}
${authorName ? `Author: ${authorName}` : ""}
${input.bookResearch ? `\nSupplemental book research:\n${input.bookResearch}` : ""}

Requirements:
- Quiz title: "${quizTitle}"
${outcomeInstruction}
- Tone: ${tone}
- Question style: ${questionStyle}
- Include outcome descriptions: ${includeDescriptions ? "yes, 2-3 sentences each" : "keep descriptions to one short sentence"}
- Create 5-8 questions with 3-4 answers each.
- Questions must use real-life situations readers can relate to — everyday choices about conflict, trust, risk, loyalty, solitude, ambition, etc.
- Do NOT place the reader inside the book's fictional world. Avoid in-world fantasy scenarios (e.g. "A dragon blocks your path", "You're in the enchanted forest", "The king summons you").
- Reveal character alignment through how someone acts in ordinary life, not through plot-specific roleplay.
- Set allow_multiple to false unless the question genuinely supports multiple selections.
- Every answer must include weighted scores (0-10) for EVERY outcome id.
- Use stable temporary outcome ids like outcome_1, outcome_2, etc.
- Make scoring balanced so every outcome is reachable with thoughtful answers.
- Avoid spoilers beyond what the synopsis implies.
- Write in clear, engaging language suitable for readers discovering the book.

Return structured JSON only.`
}

type BookResearchPromptInput = {
  bookTitle: string
  authorName?: string
  synopsis?: string
}

export function buildBookResearchPrompt(input: BookResearchPromptInput) {
  return `You are a literary researcher helping an author create a "Which character are you?" personality quiz.

Book title: ${input.bookTitle}
${input.authorName ? `Author: ${input.authorName}` : ""}
${input.synopsis ? `Author-provided synopsis:\n${input.synopsis}` : ""}

Using your knowledge of this book and any synopsis provided:
- Summarize the plot, tone, themes, and main characters
- Note the genre and what makes each character psychologically distinct
- For well-known published books, draw on accurate knowledge of the work
- For indie, self-published, or obscure titles, treat the author-provided synopsis as the primary source of truth

If an author-provided synopsis is present, always set found to true and build your research from it (enriched by your knowledge when the book is familiar).
Only set found to false when there is no synopsis and you have no reliable knowledge of the book.

Do not invent major plot points or characters beyond what the title, author, and synopsis support.

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
Preserve quality: balanced scoring, 2+ answers per question, engaging copy.
Questions should stay in real-life, relatable situations — not in-world fantasy scenarios from the book.`
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

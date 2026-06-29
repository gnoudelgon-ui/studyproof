import { GoogleGenerativeAI, GenerateContentResult } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const MODEL_NAME = 'gemini-2.5-flash'

export const gemini = genAI.getGenerativeModel({ model: MODEL_NAME })

/**
 * Generate text from a prompt using Gemini 2.5 Flash
 */
export async function generateText(prompt: string): Promise<string> {
  const result: GenerateContentResult = await gemini.generateContent(prompt)
  const response = result.response
  return response.text()
}

/**
 * Generate text with streaming support
 */
export async function generateTextStream(
  prompt: string,
  onChunk: (text: string) => void
): Promise<string> {
  const result = await gemini.generateContentStream(prompt)
  let fullText = ''

  for await (const chunk of result.stream) {
    const chunkText = chunk.text()
    fullText += chunkText
    onChunk(chunkText)
  }

  return fullText
}

/**
 * Generate structured JSON output from a prompt
 */
export async function generateJSON<T>(prompt: string): Promise<T> {
  const jsonPrompt = `${prompt}\n\nRespond ONLY with valid JSON, no markdown or explanation.`
  const text = await generateText(jsonPrompt)

  // Strip markdown code blocks if present
  const cleaned = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
  return JSON.parse(cleaned) as T
}

/**
 * Summarize document text
 */
export async function summarizeDocument(text: string): Promise<string> {
  const { PROMPTS } = await import('./prompts')
  return generateText(PROMPTS.summarize(text))
}

/**
 * Generate quiz questions from document text
 */
export async function generateQuiz(text: string, count = 5) {
  const { PROMPTS } = await import('./prompts')
  return generateJSON<{
    questions: Array<{
      question: string
      options: Record<string, string>
      answer: string
      explanation: string
    }>
  }>(PROMPTS.generateQuiz(text, count))
}

/**
 * Generate flashcards from document text
 */
export async function generateFlashcards(text: string, count = 10) {
  const { PROMPTS } = await import('./prompts')
  return generateJSON<{
    flashcards: Array<{ front: string; back: string }>
  }>(PROMPTS.flashcards(text, count))
}

/**
 * Explain a concept with document context
 */
export async function explainConcept(concept: string, context: string): Promise<string> {
  const { PROMPTS } = await import('./prompts')
  return generateText(PROMPTS.explainConcept(concept, context))
}

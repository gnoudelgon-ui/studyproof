import { generateJSON } from '@/lib/ai/gemini'
import { PROMPTS } from '@/lib/ai/prompts'
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface LearningBlock {
  title: string
  teach_card: string
  memory_aid: string
  common_mistakes: string[]
}

interface QuizQuestion {
  question: string
  type: 'multiple_choice' | 'short_answer'
  options?: string[]
  correct_answer: string
  explanation: string
}

export async function POST(req: NextRequest) {
  try {
    const { document_id } = await req.json()

    if (!document_id) {
      return NextResponse.json({ error: 'Thiếu document_id' }, { status: 400 })
    }

    const admin = await createAdminClient()

    const { data: document, error: docError } = await admin
      .from('documents')
      .select('id, content')
      .eq('id', document_id)
      .single()

    if (docError || !document) {
      return NextResponse.json({ error: 'Không tìm thấy tài liệu' }, { status: 404 })
    }

    const { data: blocks, error: blocksError } = await admin
      .from('learning_blocks')
      .select('title, teach_card, memory_aid, common_mistakes')
      .eq('document_id', document_id)
      .order('block_index')

    if (blocksError) {
      console.error('Load blocks error:', blocksError)
      return NextResponse.json({ error: 'Lỗi tải learning blocks' }, { status: 500 })
    }

    const blockText = ((blocks ?? []) as LearningBlock[])
      .map((block, index) => {
        const mistakes = (block.common_mistakes ?? []).join('; ')
        return `${index + 1}. ${block.title}\n${block.teach_card}\nMẹo nhớ: ${block.memory_aid}\nLỗi phổ biến: ${mistakes}`
      })
      .join('\n\n')

    const result = await generateJSON<{ questions: QuizQuestion[] }>(
      PROMPTS.generatePracticeQuiz(document.content.slice(0, 8000), blockText.slice(0, 8000))
    )

    const questions = (result.questions ?? []).slice(0, 10).map((question) => ({
      question: question.question,
      type: question.type === 'short_answer' ? 'short_answer' : 'multiple_choice',
      options: question.type === 'short_answer' ? [] : question.options ?? [],
      correct_answer: question.correct_answer,
      explanation: question.explanation,
    }))

    if (questions.length < 1) {
      return NextResponse.json({ error: 'Không tạo được quiz' }, { status: 500 })
    }

    const { data: quiz, error: quizError } = await admin
      .from('quizzes')
      .insert({
        document_id,
        questions,
      })
      .select('id, document_id, questions, created_at')
      .single()

    if (quizError || !quiz) {
      console.error('Insert quiz error:', quizError)
      return NextResponse.json({ error: 'Lỗi lưu quiz' }, { status: 500 })
    }

    return NextResponse.json({ quiz })
  } catch (err) {
    console.error('Generate quiz error:', err)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
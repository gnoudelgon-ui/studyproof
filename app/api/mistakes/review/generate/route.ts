import { generateJSON } from '@/lib/ai/gemini'
import { PROMPTS } from '@/lib/ai/prompts'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface Mistake {
  id: string
  source: string
  content: string
  correct_answer: string | null
  times_wrong: number
}

interface ReviewQuestion {
  mistake_id: string
  question: string
  type: 'multiple_choice' | 'short_answer'
  options?: string[]
  correct_answer: string
  explanation: string
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const { documentId } = await req.json()

    if (!documentId) {
      return NextResponse.json({ error: 'Thiếu documentId' }, { status: 400 })
    }

    const admin = await createAdminClient()

    const { data: document, error: docError } = await admin
      .from('documents')
      .select('id')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (docError || !document) {
      return NextResponse.json({ error: 'Không tìm thấy tài liệu' }, { status: 404 })
    }

    const { data, error } = await admin
      .from('mistakes')
      .select('id, source, content, correct_answer, times_wrong')
      .eq('document_id', documentId)
      .eq('user_id', user.id)
      .order('times_wrong', { ascending: false })
      .order('last_seen', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Load review mistakes error:', error)
      return NextResponse.json({ error: 'Lỗi tải danh sách lỗi' }, { status: 500 })
    }

    const mistakes = (data ?? []) as Mistake[]

    if (mistakes.length === 0) {
      return NextResponse.json({ error: 'Chưa có lỗi nào để ôn lại' }, { status: 400 })
    }

    const count = Math.min(5, Math.max(3, mistakes.length))
    const mistakesText = mistakes
      .map((mistake, index) => (
        `${index + 1}. mistake_id: ${mistake.id}\nNguồn: ${mistake.source}\nNội dung lỗi: ${mistake.content}\nĐáp án đúng: ${mistake.correct_answer ?? ''}\nSố lần sai: ${mistake.times_wrong}`
      ))
      .join('\n\n')

    const result = await generateJSON<{ questions: ReviewQuestion[] }>(
      PROMPTS.generateMistakeReviewQuiz(mistakesText, count)
    )

    const allowedIds = new Set(mistakes.map((mistake) => mistake.id))
    const questions = (result.questions ?? [])
      .filter((question) => allowedIds.has(question.mistake_id))
      .slice(0, 5)
      .map((question) => ({
        mistake_id: question.mistake_id,
        question: question.question,
        type: question.type === 'short_answer' ? 'short_answer' : 'multiple_choice',
        options: question.type === 'short_answer' ? [] : question.options ?? [],
        correct_answer: question.correct_answer,
        explanation: question.explanation,
      }))

    if (questions.length === 0) {
      return NextResponse.json({ error: 'Không tạo được quiz ôn lại' }, { status: 500 })
    }

    return NextResponse.json({ questions })
  } catch (err) {
    console.error('Generate review quiz error:', err)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
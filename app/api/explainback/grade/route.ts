import { generateJSON } from '@/lib/ai/gemini'
import { PROMPTS } from '@/lib/ai/prompts'
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const MVP_USER_ID = '00000000-0000-0000-0000-000000000000'

interface LearningBlock {
  title: string
  teach_card: string
  memory_aid: string
  common_mistakes: string[]
}

interface ExplainBackGrade {
  score: number
  missing_points: string[]
  wrong_logic: string[]
  good_points: string[]
  follow_up_question: string
}

export async function POST(req: NextRequest) {
  try {
    const { document_id, user_explanation } = await req.json()

    if (!document_id || !user_explanation || user_explanation.trim().length < 20) {
      return NextResponse.json(
        { error: 'Thiếu document_id hoặc phần giải thích quá ngắn' },
        { status: 400 }
      )
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

    const grade = await generateJSON<ExplainBackGrade>(
      PROMPTS.gradeExplainBack(
        document.content.slice(0, 8000),
        blockText.slice(0, 8000),
        user_explanation.trim().slice(0, 6000)
      )
    )

    const missing = Array.isArray(grade.missing_points) ? grade.missing_points : []
    const wrong = Array.isArray(grade.wrong_logic) ? grade.wrong_logic : []
    const mistakes = [
      ...missing.map((point) => ({
        user_id: MVP_USER_ID,
        document_id,
        source: 'explainback',
        content: point,
        correct_answer: 'Bổ sung ý còn thiếu trong phần giải thích.',
      })),
      ...wrong.map((point) => ({
        user_id: MVP_USER_ID,
        document_id,
        source: 'explainback',
        content: point,
        correct_answer: 'Sửa lại logic theo nội dung tài liệu.',
      })),
    ]

    if (mistakes.length > 0) {
      const { error: mistakesError } = await admin
        .from('mistakes')
        .insert(mistakes)

      if (mistakesError) {
        console.error('Insert explainback mistakes error:', mistakesError)
      }
    }

    return NextResponse.json({
      score: Math.max(0, Math.min(100, Math.round(Number(grade.score) || 0))),
      missing_points: missing,
      wrong_logic: wrong,
      good_points: Array.isArray(grade.good_points) ? grade.good_points : [],
      follow_up_question: grade.follow_up_question ?? '',
    })
  } catch (err) {
    console.error('Grade explainback error:', err)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
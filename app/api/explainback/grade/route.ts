import { generateJSON } from '@/lib/ai/gemini'
import { PROMPTS } from '@/lib/ai/prompts'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface LearningBlock {
  title: string
  teach_card: string
  memory_aid: string
  common_mistakes: string[]
}

interface ExplainBackGrade {
  score: number | string | null
  missing_points: string[]
  wrong_logic: string[]
  good_points: string[]
  follow_up_question: string
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)))
}

function normalizeExplainBackScore(grade: ExplainBackGrade) {
  const parsed = Number(grade.score)

  if (Number.isFinite(parsed)) {
    return { score: clampScore(parsed), usedFallback: false }
  }

  const goodCount = Array.isArray(grade.good_points) ? grade.good_points.length : 0
  const missingCount = Array.isArray(grade.missing_points) ? grade.missing_points.length : 0
  const wrongCount = Array.isArray(grade.wrong_logic) ? grade.wrong_logic.length : 0
  const fallback = 70 + Math.min(goodCount, 4) * 5 - missingCount * 10 - wrongCount * 20

  return { score: clampScore(fallback), usedFallback: true }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

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
      .eq('user_id', user.id)
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

    const scoreResult = normalizeExplainBackScore(grade)
    const missing = Array.isArray(grade.missing_points) ? grade.missing_points : []
    const wrong = Array.isArray(grade.wrong_logic) ? grade.wrong_logic : []
    const good = Array.isArray(grade.good_points) ? grade.good_points : []

    console.info('ExplainBack Gemini grade:', {
      rawScore: grade.score,
      normalizedScore: scoreResult.score,
      usedFallback: scoreResult.usedFallback,
      goodCount: good.length,
      missingCount: missing.length,
      wrongCount: wrong.length,
    })
    const mistakes = [
      ...missing.map((point) => ({
        user_id: user.id,
        document_id,
        source: 'explainback',
        content: point,
        correct_answer: 'Bổ sung ý còn thiếu trong phần giải thích.',
      })),
      ...wrong.map((point) => ({
        user_id: user.id,
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
      score: scoreResult.score,
      missing_points: missing,
      wrong_logic: wrong,
      good_points: good,
      follow_up_question: grade.follow_up_question ?? '',
    })
  } catch (err) {
    console.error('Grade explainback error:', err)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
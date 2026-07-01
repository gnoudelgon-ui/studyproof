import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface ReviewQuestion {
  mistake_id: string
  question: string
  type: 'multiple_choice' | 'short_answer'
  correct_answer: string
  explanation: string
}

function normalizeAnswer(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/^([a-d])\s*[.)-]?\s*/i, '$1')
    .replace(/\s+/g, ' ')
}

function getChoiceLabel(value: unknown) {
  const match = String(value ?? '').trim().match(/^([A-Da-d])\s*[.)-]?/)
  return match?.[1]?.toLowerCase() ?? null
}

function isCorrectAnswer(userAnswer: unknown, correctAnswer: string) {
  const userChoice = getChoiceLabel(userAnswer)
  const correctChoice = getChoiceLabel(correctAnswer)

  if (userChoice && correctChoice) {
    return userChoice === correctChoice
  }

  return normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer)
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const { documentId, questions, answers } = await req.json()

    if (!documentId || !Array.isArray(questions) || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Thiếu documentId, questions hoặc answers' }, { status: 400 })
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

    const reviewQuestions = questions as ReviewQuestion[]
    const mistakeIds = Array.from(new Set(reviewQuestions.map((question) => question.mistake_id)))

    const { data: mistakes, error: mistakesError } = await admin
      .from('mistakes')
      .select('id, times_wrong')
      .eq('document_id', documentId)
      .eq('user_id', user.id)
      .in('id', mistakeIds)

    if (mistakesError) {
      console.error('Load review submit mistakes error:', mistakesError)
      return NextResponse.json({ error: 'Lỗi tải danh sách lỗi' }, { status: 500 })
    }

    const mistakeMap = new Map((mistakes ?? []).map((mistake) => [mistake.id, mistake.times_wrong as number]))
    const results = reviewQuestions.map((question, index) => {
      const userAnswer = answers[index] ?? ''
      const is_correct = isCorrectAnswer(userAnswer, question.correct_answer)

      return {
        mistake_id: question.mistake_id,
        question: question.question,
        user_answer: userAnswer,
        correct_answer: question.correct_answer,
        is_correct,
        explanation: question.explanation,
      }
    })

    await Promise.all(results.map((result) => {
      const currentTimesWrong = mistakeMap.get(result.mistake_id)
      if (currentTimesWrong === undefined) return Promise.resolve()

      const nextTimesWrong = result.is_correct
        ? Math.max(0, currentTimesWrong - 1)
        : currentTimesWrong + 1

      return admin
        .from('mistakes')
        .update({
          times_wrong: nextTimesWrong,
          last_seen: new Date().toISOString(),
        })
        .eq('id', result.mistake_id)
        .eq('user_id', user.id)
        .eq('document_id', documentId)
    }))

    const correctCount = results.filter((result) => result.is_correct).length
    const score = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0

    return NextResponse.json({
      score,
      correct_count: correctCount,
      total: results.length,
      results,
    })
  } catch (err) {
    console.error('Submit review quiz error:', err)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
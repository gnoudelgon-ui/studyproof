import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface QuizQuestion {
  question: string
  type: 'multiple_choice' | 'short_answer'
  options?: string[]
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

    const { quiz_id, answers } = await req.json()

    if (!quiz_id || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Thiếu quiz_id hoặc answers' }, { status: 400 })
    }

    const admin = await createAdminClient()

    const { data: quiz, error: quizError } = await admin
      .from('quizzes')
      .select('id, document_id, questions')
      .eq('id', quiz_id)
      .single()

    if (quizError || !quiz) {
      return NextResponse.json({ error: 'Không tìm thấy quiz' }, { status: 404 })
    }

    const { data: document, error: docError } = await admin
      .from('documents')
      .select('id')
      .eq('id', quiz.document_id)
      .eq('user_id', user.id)
      .single()

    if (docError || !document) {
      return NextResponse.json({ error: 'Không tìm thấy tài liệu' }, { status: 404 })
    }

    const questions = (quiz.questions ?? []) as QuizQuestion[]
    const results = questions.map((question, index) => {
      const userAnswer = answers[index] ?? ''
      const is_correct = isCorrectAnswer(userAnswer, question.correct_answer)

      return {
        question_index: index,
        question: question.question,
        type: question.type,
        user_answer: userAnswer,
        correct_answer: question.correct_answer,
        is_correct,
        explanation: question.explanation,
      }
    })

    const correctCount = results.filter((result) => result.is_correct).length
    const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0

    const { error: attemptError } = await admin
      .from('quiz_attempts')
      .insert({
        user_id: user.id,
        document_id: quiz.document_id,
        answers,
        score,
      })

    if (attemptError) {
      console.error('Insert quiz attempt error:', attemptError)
      return NextResponse.json({ error: 'Lỗi lưu kết quả quiz' }, { status: 500 })
    }

    const wrongMistakes = results
      .filter((result) => !result.is_correct)
      .map((result) => ({
        user_id: user.id,
        document_id: quiz.document_id,
        source: 'quiz',
        content: result.question,
        correct_answer: result.correct_answer,
      }))

    if (wrongMistakes.length > 0) {
      const { error: mistakesError } = await admin
        .from('mistakes')
        .insert(wrongMistakes)

      if (mistakesError) {
        console.error('Insert quiz mistakes error:', mistakesError)
      }
    }

    return NextResponse.json({
      score,
      correct_count: correctCount,
      total: questions.length,
      results,
    })
  } catch (err) {
    console.error('Submit quiz error:', err)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
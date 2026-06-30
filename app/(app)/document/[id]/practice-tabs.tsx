'use client'

import { useState } from 'react'

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  concept: { label: 'Khái niệm', color: 'bg-blue-100 text-blue-700' },
  fact: { label: 'Sự kiện', color: 'bg-green-100 text-green-700' },
  procedure: { label: 'Quy trình', color: 'bg-purple-100 text-purple-700' },
  principle: { label: 'Nguyên lý', color: 'bg-orange-100 text-orange-700' },
  example: { label: 'Ví dụ', color: 'bg-pink-100 text-pink-700' },
}

type Tab = 'learn' | 'quiz' | 'explainback'

interface Block {
  id: string
  block_index: number
  knowledge_type: string
  title: string
  teach_card: string
  memory_aid: string
  common_mistakes: string[]
}

interface QuizQuestion {
  question: string
  type: 'multiple_choice' | 'short_answer'
  options: string[]
  correct_answer: string
  explanation: string
}

interface Quiz {
  id: string
  document_id: string
  questions: QuizQuestion[]
  created_at: string
}

interface QuizResult {
  score: number
  correct_count: number
  total: number
  results: Array<{
    question_index: number
    question: string
    type: 'multiple_choice' | 'short_answer'
    user_answer: string
    correct_answer: string
    is_correct: boolean
    explanation: string
  }>
}

interface ExplainBackResult {
  score: number
  missing_points: string[]
  wrong_logic: string[]
  good_points: string[]
  follow_up_question: string
}

export function PracticeTabs({
  documentId,
  learningBlocks,
}: {
  documentId: string
  learningBlocks: Block[]
}) {
  const [tab, setTab] = useState<Tab>('learn')
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [quizAnswers, setQuizAnswers] = useState<string[]>([])
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null)
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizError, setQuizError] = useState<string | null>(null)
  const [explanation, setExplanation] = useState('')
  const [explainBackResult, setExplainBackResult] = useState<ExplainBackResult | null>(null)
  const [explainBackLoading, setExplainBackLoading] = useState(false)
  const [explainBackError, setExplainBackError] = useState<string | null>(null)

  const updateQuizAnswer = (index: number, answer: string) => {
    setQuizAnswers((current) => {
      const next = [...current]
      next[index] = answer
      return next
    })
  }

  const generateQuiz = async () => {
    setQuizLoading(true)
    setQuizError(null)
    setQuizResult(null)

    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: documentId }),
      })
      const data = await res.json()

      if (!res.ok) {
        setQuizError(data.error || 'Không tạo được quiz')
        return
      }

      setQuiz(data.quiz)
      setQuizAnswers(new Array(data.quiz.questions.length).fill(''))
    } catch {
      setQuizError('Không thể kết nối server')
    } finally {
      setQuizLoading(false)
    }
  }

  const submitQuiz = async () => {
    if (!quiz) return

    setQuizLoading(true)
    setQuizError(null)

    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quiz_id: quiz.id, answers: quizAnswers }),
      })
      const data = await res.json()

      if (!res.ok) {
        setQuizError(data.error || 'Không nộp được quiz')
        return
      }

      setQuizResult(data)
    } catch {
      setQuizError('Không thể kết nối server')
    } finally {
      setQuizLoading(false)
    }
  }

  const submitExplainBack = async () => {
    setExplainBackLoading(true)
    setExplainBackError(null)
    setExplainBackResult(null)

    try {
      const res = await fetch('/api/explainback/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: documentId, user_explanation: explanation }),
      })
      const data = await res.json()

      if (!res.ok) {
        setExplainBackError(data.error || 'Không chấm được phần trả bài')
        return
      }

      setExplainBackResult(data)
    } catch {
      setExplainBackError('Không thể kết nối server')
    } finally {
      setExplainBackLoading(false)
    }
  }

  return (
    <>
      <div className="mb-6 flex gap-2 border-b border-gray-200">
        {[
          { id: 'learn', label: 'Học' },
          { id: 'quiz', label: 'Quiz' },
          { id: 'explainback', label: 'Trả bài' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id as Tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === item.id
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'learn' && (
        learningBlocks.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="text-4xl mb-3">⏳</div>
            <p>Đang tạo learning blocks... Thử tải lại trang.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {learningBlocks.map((block) => {
              const type = TYPE_LABELS[block.knowledge_type] ?? {
                label: block.knowledge_type,
                color: 'bg-gray-100 text-gray-700',
              }
              return (
                <div
                  key={block.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-semibold text-gray-900 leading-snug">
                      {block.title}
                    </h2>
                    <span
                      className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${type.color}`}
                    >
                      {type.label}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 leading-relaxed">
                    {block.teach_card}
                  </p>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                    <p className="text-xs font-medium text-yellow-700 mb-0.5">
                      💡 Mẹo nhớ
                    </p>
                    <p className="text-sm text-yellow-800">{block.memory_aid}</p>
                  </div>

                  {block.common_mistakes.length > 0 && (
                    <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                      <p className="text-xs font-medium text-red-600 mb-1">
                        ⚠️ Lỗi hay gặp
                      </p>
                      <ul className="space-y-0.5">
                        {block.common_mistakes.map((mistake, index) => (
                          <li key={index} className="text-xs text-red-700">
                            • {mistake}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}

      {tab === 'quiz' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Quiz</h2>
            <button
              type="button"
              onClick={generateQuiz}
              disabled={quizLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {quizLoading ? 'Đang tạo...' : 'Tạo Quiz'}
            </button>
          </div>

          {quizError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {quizError}
            </div>
          )}

          {quiz && (
            <div className="space-y-4">
              {quiz.questions.map((question, index) => (
                <div key={index} className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 w-7 h-7 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <div className="flex-1 space-y-3">
                      <p className="font-medium text-gray-900">{question.question}</p>

                      {question.type === 'multiple_choice' ? (
                        <div className="space-y-2">
                          {(question.options ?? []).map((option) => (
                            <label key={option} className="flex items-center gap-2 text-sm text-gray-700">
                              <input
                                type="radio"
                                name={`question-${index}`}
                                value={option}
                                checked={quizAnswers[index] === option}
                                onChange={(event) => updateQuizAnswer(index, event.target.value)}
                                className="h-4 w-4"
                              />
                              <span>{option}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <textarea
                          value={quizAnswers[index] ?? ''}
                          onChange={(event) => updateQuizAnswer(index, event.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Nhập câu trả lời ngắn..."
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={submitQuiz}
                disabled={quizLoading || quizAnswers.some((answer) => !answer?.trim())}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {quizLoading ? 'Đang nộp...' : 'Nộp bài'}
              </button>
            </div>
          )}

          {quizResult && (
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Kết quả</h3>
                <span className="text-xl font-bold text-blue-700">{quizResult.score}/100</span>
              </div>
              <p className="text-sm text-gray-600">
                Đúng {quizResult.correct_count}/{quizResult.total} câu
              </p>
              <div className="space-y-3">
                {quizResult.results.map((result) => (
                  <div
                    key={result.question_index}
                    className={`rounded-lg border px-4 py-3 ${
                      result.is_correct
                        ? 'bg-green-50 border-green-100'
                        : 'bg-red-50 border-red-100'
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {result.question_index + 1}. {result.question}
                    </p>
                    <p className="text-xs text-gray-600">Đáp án của bạn: {result.user_answer || 'Chưa trả lời'}</p>
                    <p className="text-xs text-gray-600">Đáp án đúng: {result.correct_answer}</p>
                    <p className="text-sm text-gray-700 mt-2">{result.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'explainback' && (
        <div className="space-y-5">
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Trả bài</h2>
            <textarea
              value={explanation}
              onChange={(event) => setExplanation(event.target.value)}
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Viết lại nội dung bạn hiểu bằng lời của mình..."
            />
            {explainBackError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {explainBackError}
              </div>
            )}
            <button
              type="button"
              onClick={submitExplainBack}
              disabled={explainBackLoading || explanation.trim().length < 20}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {explainBackLoading ? 'Đang chấm...' : 'Submit'}
            </button>
          </div>

          {explainBackResult && (
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Feedback</h3>
                <span className="text-xl font-bold text-blue-700">{explainBackResult.score}/100</span>
              </div>

              <FeedbackList title="Điểm tốt" items={explainBackResult.good_points} tone="green" />
              <FeedbackList title="Thiếu ý" items={explainBackResult.missing_points} tone="yellow" />
              <FeedbackList title="Sai logic" items={explainBackResult.wrong_logic} tone="red" />

              {explainBackResult.follow_up_question && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
                  <p className="text-xs font-medium text-blue-700 mb-1">Câu hỏi tiếp theo</p>
                  <p className="text-sm text-blue-900">{explainBackResult.follow_up_question}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}

function FeedbackList({
  title,
  items,
  tone,
}: {
  title: string
  items: string[]
  tone: 'green' | 'yellow' | 'red'
}) {
  if (items.length === 0) return null

  const styles = {
    green: 'bg-green-50 border-green-100 text-green-800',
    yellow: 'bg-yellow-50 border-yellow-100 text-yellow-800',
    red: 'bg-red-50 border-red-100 text-red-800',
  }

  return (
    <div className={`border rounded-lg px-4 py-3 ${styles[tone]}`}>
      <p className="text-xs font-medium mb-2">{title}</p>
      <ul className="space-y-1">
        {items.map((item, index) => (
          <li key={index} className="text-sm">
            • {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
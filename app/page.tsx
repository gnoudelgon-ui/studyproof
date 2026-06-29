'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function HomePage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (content.trim().length < 50) {
      setError('Vui lòng nhập ít nhất 50 ký tự')
      return
    }
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Có lỗi xảy ra')
        setLoading(false)
        return
      }

      router.push(`/document/${data.id}`)
    } catch {
      setError('Không thể kết nối server')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-700">📚 StudyProof</h1>
          <div className="flex gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-blue-600">
              Đăng nhập
            </Link>
            <Link
              href="/signup"
              className="text-sm px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Đăng ký
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-gray-900 mb-3">
            Học thông minh hơn với AI
          </h2>
          <p className="text-lg text-gray-600">
            Paste tài liệu vào — AI sẽ tạo ngay Learning Blocks giúp bạn ghi nhớ hiệu quả
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiêu đề tài liệu <span className="text-gray-400">(tuỳ chọn)</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Chương 3 — Cấu trúc dữ liệu"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nội dung tài liệu <span className="text-red-500">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste nội dung tài liệu vào đây... (giáo trình, bài giảng, ghi chú, v.v.)"
                rows={12}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                {content.length} ký tự
                {content.length > 0 && content.length < 50 && (
                  <span className="text-orange-500"> — cần thêm {50 - content.length} ký tự nữa</span>
                )}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || content.trim().length < 50}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  AI đang phân tích tài liệu...
                </>
              ) : (
                '✨ Phân tích tài liệu'
              )}
            </button>
          </form>
        </div>

        <div className="mt-10 grid grid-cols-3 gap-6 text-center">
          {[
            { icon: '🧩', title: 'Learning Blocks', desc: 'Chia nhỏ kiến thức thành các đơn vị dễ học' },
            { icon: '🧠', title: 'Mẹo ghi nhớ', desc: 'AI tạo liên tưởng giúp nhớ lâu hơn' },
            { icon: '⚠️', title: 'Lỗi phổ biến', desc: 'Biết trước những sai lầm hay gặp' },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-xl p-5 shadow-sm">
              <div className="text-3xl mb-2">{f.icon}</div>
              <h3 className="font-semibold text-gray-800 mb-1">{f.title}</h3>
              <p className="text-xs text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

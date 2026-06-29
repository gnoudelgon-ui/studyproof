import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'

interface Props {
  params: { id: string }
}

export default async function DocumentPage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  if (params.id === 'new') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-xl font-bold text-gray-900">Tải lên tài liệu mới</h1>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <div className="text-5xl mb-4">📄</div>
              <p className="text-gray-600 mb-2">Kéo thả file PDF vào đây</p>
              <p className="text-gray-400 text-sm mb-4">hoặc</p>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                Chọn file
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-xl font-bold text-gray-900">Tài liệu #{params.id}</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Nội dung tài liệu</h2>
            <p className="text-gray-500 text-sm">Đang tải...</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Công cụ AI</h2>
            <div className="space-y-3">
              {['Tóm tắt', 'Tạo Quiz', 'Flashcards', 'Giải thích khái niệm'].map((tool) => (
                <button
                  key={tool}
                  className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 text-sm font-medium text-gray-700"
                >
                  {tool}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

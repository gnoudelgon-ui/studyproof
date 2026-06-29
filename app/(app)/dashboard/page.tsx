import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">StudyProof</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="text-sm text-red-600 hover:underline"
              >
                Đăng xuất
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Tài liệu của tôi</h2>
          <Link
            href="/document/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            + Tải lên tài liệu
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-5xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có tài liệu nào</h3>
          <p className="text-gray-500 text-sm mb-6">
            Tải lên tài liệu PDF để bắt đầu học với AI
          </p>
          <Link
            href="/document/new"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            Tải lên tài liệu đầu tiên
          </Link>
        </div>
      </main>
    </div>
  )
}

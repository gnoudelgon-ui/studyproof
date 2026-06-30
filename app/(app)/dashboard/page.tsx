import { AuthHeader } from '@/components/auth-header'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

interface DocumentRow {
  id: string
  title: string
  created_at: string
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const admin = await createAdminClient()
  const { data: documents, error: docsError } = await admin
    .from('documents')
    .select('id, title, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (docsError) {
    console.error('Load dashboard documents error:', docsError)
  }

  const docs = (documents ?? []) as DocumentRow[]
  const documentIds = docs.map((doc) => doc.id)

  const [{ data: blockRows }, { data: mistakeRows }] = documentIds.length > 0
    ? await Promise.all([
        admin
          .from('learning_blocks')
          .select('document_id')
          .in('document_id', documentIds),
        admin
          .from('mistakes')
          .select('document_id')
          .eq('user_id', user.id)
          .in('document_id', documentIds),
      ])
    : [{ data: [] }, { data: [] }]

  const blockCounts = countByDocument(blockRows ?? [])
  const mistakeCounts = countByDocument(mistakeRows ?? [])

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthHeader email={user.email ?? 'Người dùng'} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-gray-800">Tài liệu của tôi</h2>
          <Link
            href="/"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            Upload tài liệu mới
          </Link>
        </div>

        {docs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-5xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có tài liệu nào</h3>
            <p className="text-gray-500 text-sm mb-6">
              Upload tài liệu đầu tiên để bắt đầu học với AI
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              Upload tài liệu mới
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {docs.map((doc) => (
              <Link
                key={doc.id}
                href={`/document/${doc.id}`}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:border-blue-200 hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-gray-900 line-clamp-2 mb-3">{doc.title}</h3>
                <p className="text-xs text-gray-500 mb-4">
                  {new Date(doc.created_at).toLocaleDateString('vi-VN')}
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-blue-50 px-3 py-2">
                    <p className="text-xs text-blue-600">Blocks</p>
                    <p className="font-semibold text-blue-900">{blockCounts[doc.id] ?? 0}</p>
                  </div>
                  <div className="rounded-lg bg-red-50 px-3 py-2">
                    <p className="text-xs text-red-600">Mistakes</p>
                    <p className="font-semibold text-red-900">{mistakeCounts[doc.id] ?? 0}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function countByDocument(rows: Array<{ document_id: string }>) {
  return rows.reduce<Record<string, number>>((counts, row) => {
    counts[row.document_id] = (counts[row.document_id] ?? 0) + 1
    return counts
  }, {})
}
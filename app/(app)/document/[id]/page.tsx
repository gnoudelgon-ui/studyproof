import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  concept:   { label: 'Khái niệm',   color: 'bg-blue-100 text-blue-700' },
  fact:      { label: 'Sự kiện',     color: 'bg-green-100 text-green-700' },
  procedure: { label: 'Quy trình',   color: 'bg-purple-100 text-purple-700' },
  principle: { label: 'Nguyên lý',   color: 'bg-orange-100 text-orange-700' },
  example:   { label: 'Ví dụ',       color: 'bg-pink-100 text-pink-700' },
}

interface Block {
  id: string
  block_index: number
  knowledge_type: string
  title: string
  teach_card: string
  memory_aid: string
  common_mistakes: string[]
}

interface Document {
  id: string
  title: string
  content: string
  created_at: string
}

export default async function DocumentPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: doc } = await supabase
    .from('documents')
    .select('id, title, content, created_at')
    .eq('id', params.id)
    .single()

  if (!doc) redirect('/dashboard')

  const { data: blocks } = await supabase
    .from('learning_blocks')
    .select('*')
    .eq('document_id', params.id)
    .order('block_index')

  const document = doc as Document
  const learningBlocks = (blocks ?? []) as Block[]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-700 text-sm">
            ← Dashboard
          </Link>
          <h1 className="font-semibold text-gray-900 truncate flex-1">
            {document.title}
          </h1>
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {learningBlocks.length} blocks
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {learningBlocks.length === 0 ? (
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
                  {/* Type badge + title */}
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

                  {/* Teach card */}
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {block.teach_card}
                  </p>

                  {/* Memory aid */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                    <p className="text-xs font-medium text-yellow-700 mb-0.5">
                      💡 Mẹo nhớ
                    </p>
                    <p className="text-sm text-yellow-800">{block.memory_aid}</p>
                  </div>

                  {/* Common mistakes */}
                  {block.common_mistakes.length > 0 && (
                    <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                      <p className="text-xs font-medium text-red-600 mb-1">
                        ⚠️ Lỗi hay gặp
                      </p>
                      <ul className="space-y-0.5">
                        {block.common_mistakes.map((m, i) => (
                          <li key={i} className="text-xs text-red-700">
                            • {m}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

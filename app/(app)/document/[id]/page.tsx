import { createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PracticeTabs } from './practice-tabs'

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
  const supabase = await createAdminClient()

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
        <PracticeTabs documentId={document.id} learningBlocks={learningBlocks} />
      </main>
    </div>
  )
}